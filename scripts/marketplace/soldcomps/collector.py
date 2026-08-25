from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)
from scripts.marketplace.soldcomps.api import (
    SoldCompsQuotaExhaustedError,
)
from scripts.marketplace.soldcomps.sale_importer import (
    upsert_soldcomps_sales,
)
from scripts.marketplace.soldcomps.sales import (
    fetch_sold_booster_box_sales,
)
from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


SOLDCOMPS_INITIAL_LOOKBACK_DAYS = 30
SOLDCOMPS_INCREMENTAL_OVERLAP_DAYS = 2

SOLDCOMPS_REFRESH_HOURS = 24
SOLDCOMPS_QUOTA_COOLDOWN_HOURS = 24

SOLDCOMPS_MAX_PRODUCTS_PER_RUN = 10

SOLDCOMPS_DATA_SOURCE = "soldcomps"


def _utc_now() -> datetime:
    return datetime.now(UTC)


def _parse_datetime(
    value: Any,
) -> datetime | None:
    if not value:
        return None

    normalized_value = str(
        value
    ).replace(
        "Z",
        "+00:00",
    )

    parsed = datetime.fromisoformat(
        normalized_value
    )

    if parsed.tzinfo is None:
        parsed = parsed.replace(
            tzinfo=UTC,
        )

    return parsed.astimezone(
        UTC
    )


def _get_reference_price(
    *,
    product_id: int,
) -> Decimal:
    """
    Load the canonical TCGMVP reference price for
    a product from product_market_summary.

    This remains TCGPlayer/TCGCSV-derived evidence.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_market_summary"
        )
        .select(
            "current_market_price"
        )
        .eq(
            "product_id",
            product_id,
        )
        .single()
        .execute()
    )

    row = response.data

    if not row:
        raise LookupError(
            f"No market summary found for "
            f"product_id={product_id}."
        )

    value = row.get(
        "current_market_price"
    )

    if value is None:
        raise LookupError(
            f"No current market price found for "
            f"product_id={product_id}."
        )

    reference_price = Decimal(
        str(value)
    )

    if reference_price <= 0:
        raise ValueError(
            f"Invalid reference price for "
            f"product_id={product_id}: "
            f"{reference_price}"
        )

    return reference_price


def _get_stored_sales_state(
    *,
    product_id: int,
) -> dict[str, Any]:
    """
    Return lightweight SoldComps evidence state
    for one product.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "market_sales"
        )
        .select(
            "sold_at"
        )
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace",
            "ebay",
        )
        .eq(
            "data_source",
            SOLDCOMPS_DATA_SOURCE,
        )
        .order(
            "sold_at",
            desc=True,
        )
        .limit(
            1
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "has_sales": False,
            "newest_sold_at": None,
        }

    newest_sold_at = _parse_datetime(
        rows[0].get(
            "sold_at"
        )
    )

    return {
        "has_sales": True,
        "newest_sold_at": (
            newest_sold_at
        ),
    }


def _get_sync_state(
    *,
    product_id: int,
) -> dict[str, Any] | None:
    """
    Load SoldComps collection state for one
    product.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_data_source_sync"
        )
        .select(
            "product_id,"
            "data_source,"
            "last_attempted_at,"
            "last_successful_at,"
            "last_status,"
            "last_error"
        )
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "data_source",
            SOLDCOMPS_DATA_SOURCE,
        )
        .limit(
            1
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        return None

    row = rows[0]

    return {
        "product_id":
            product_id,

        "data_source":
            SOLDCOMPS_DATA_SOURCE,

        "last_attempted_at":
            _parse_datetime(
                row.get(
                    "last_attempted_at"
                )
            ),

        "last_successful_at":
            _parse_datetime(
                row.get(
                    "last_successful_at"
                )
            ),

        "last_status":
            row.get(
                "last_status"
            ),

        "last_error":
            row.get(
                "last_error"
            ),
    }


def _upsert_sync_state(
    *,
    product_id: int,
    last_attempted_at: datetime | None = None,
    last_successful_at: datetime | None = None,
    last_status: str | None = None,
    last_error: str | None = None,
) -> None:
    """
    Upsert SoldComps synchronization state.

    Existing timestamps are preserved unless a
    replacement value is explicitly supplied.
    """
    supabase = get_supabase_client()

    existing = _get_sync_state(
        product_id=product_id,
    )

    row: dict[str, Any] = {
        "product_id":
            product_id,

        "data_source":
            SOLDCOMPS_DATA_SOURCE,

        "updated_at":
            _utc_now().isoformat(),
    }

    if existing is None:
        row[
            "last_attempted_at"
        ] = (
            last_attempted_at.isoformat()
            if last_attempted_at
            else None
        )

        row[
            "last_successful_at"
        ] = (
            last_successful_at.isoformat()
            if last_successful_at
            else None
        )

        row[
            "last_status"
        ] = last_status

        row[
            "last_error"
        ] = last_error

    else:
        if last_attempted_at is not None:
            row[
                "last_attempted_at"
            ] = (
                last_attempted_at.isoformat()
            )

        if last_successful_at is not None:
            row[
                "last_successful_at"
            ] = (
                last_successful_at.isoformat()
            )

        if last_status is not None:
            row[
                "last_status"
            ] = last_status

        row[
            "last_error"
        ] = last_error

    (
        supabase
        .table(
            "product_data_source_sync"
        )
        .upsert(
            row,
            on_conflict=(
                "product_id,data_source"
            ),
        )
        .execute()
    )


def _get_provider_quota_cooldown_state(
) -> tuple[
    bool,
    float,
    datetime | None,
]:
    """
    Check whether the SoldComps provider is
    currently inside an account-wide quota
    cooldown.

    SoldComps monthly quota exhaustion applies to
    the account, not one individual product.

    Therefore any recent quota_exhausted sync row
    temporarily suppresses all SoldComps requests.

    Returns:
        (
            cooldown_active,
            remaining_hours,
            last_quota_attempt_at,
        )
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_data_source_sync"
        )
        .select(
            "last_attempted_at,"
            "last_status"
        )
        .eq(
            "data_source",
            SOLDCOMPS_DATA_SOURCE,
        )
        .eq(
            "last_status",
            "quota_exhausted",
        )
        .order(
            "last_attempted_at",
            desc=True,
        )
        .limit(
            1
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        return (
            False,
            0.0,
            None,
        )

    last_quota_attempt_at = (
        _parse_datetime(
            rows[0].get(
                "last_attempted_at"
            )
        )
    )

    if last_quota_attempt_at is None:
        return (
            False,
            0.0,
            None,
        )

    cooldown = timedelta(
        hours=(
            SOLDCOMPS_QUOTA_COOLDOWN_HOURS
        )
    )

    age = (
        _utc_now()
        - last_quota_attempt_at
    )

    if age >= cooldown:
        return (
            False,
            0.0,
            last_quota_attempt_at,
        )

    remaining = (
        cooldown
        - age
    )

    remaining_hours = max(
        0.0,
        remaining.total_seconds()
        / 3600,
    )

    return (
        True,
        remaining_hours,
        last_quota_attempt_at,
    )


def _get_incremental_sold_after(
    *,
    product_id: int,
) -> tuple[str, str]:
    """
    Determine how far back SoldComps should search.

    First collection:
        search the rolling 30-day window.

    Existing product:
        begin two days before the newest stored
        SoldComps transaction.

    The overlap protects against late-appearing or
    previously missed transactions.
    """
    sales_state = (
        _get_stored_sales_state(
            product_id=product_id,
        )
    )

    newest_sale = (
        sales_state[
            "newest_sold_at"
        ]
    )

    if newest_sale is None:
        sold_after = (
            _utc_now()
            - timedelta(
                days=(
                    SOLDCOMPS_INITIAL_LOOKBACK_DAYS
                )
            )
        ).date()

        return (
            sold_after.isoformat(),
            "initial",
        )

    sold_after = (
        newest_sale.date()
        - timedelta(
            days=(
                SOLDCOMPS_INCREMENTAL_OVERLAP_DAYS
            )
        )
    )

    return (
        sold_after.isoformat(),
        "incremental",
    )


def _build_collection_candidate(
    product: dict[str, Any],
) -> dict[str, Any]:
    """
    Build request-aware scheduling metadata
    for one configured product.
    """
    product_id = int(
        product[
            "tcgmvp_product_id"
        ]
    )

    sales_state = (
        _get_stored_sales_state(
            product_id=product_id,
        )
    )

    sync_state = (
        _get_sync_state(
            product_id=product_id,
        )
    )

    has_sales = bool(
        sales_state[
            "has_sales"
        ]
    )

    last_successful_at = (
        sync_state[
            "last_successful_at"
        ]
        if sync_state
        else None
    )

    now = _utc_now()

    if not has_sales:
        eligible = True
        priority = 0

        reason = (
            "no stored SoldComps sales"
        )

    elif last_successful_at is None:
        eligible = True
        priority = 1

        reason = (
            "no successful sync timestamp"
        )

    else:
        age = (
            now
            - last_successful_at
        )

        refresh_after = timedelta(
            hours=(
                SOLDCOMPS_REFRESH_HOURS
            )
        )

        if age >= refresh_after:
            eligible = True
            priority = 2

            reason = (
                "SoldComps sync is stale"
            )

        else:
            eligible = False
            priority = 3

            remaining = (
                refresh_after
                - age
            )

            remaining_hours = max(
                0.0,
                remaining.total_seconds()
                / 3600,
            )

            reason = (
                "fresh SoldComps sync; "
                f"eligible again in about "
                f"{remaining_hours:.1f}h"
            )

    return {
        "product":
            product,

        "product_id":
            product_id,

        "has_sales":
            has_sales,

        "sync_state":
            sync_state,

        "last_successful_at":
            last_successful_at,

        "eligible":
            eligible,

        "priority":
            priority,

        "reason":
            reason,
    }


def _candidate_sort_key(
    candidate: dict[str, Any],
) -> tuple[
    int,
    datetime,
    int,
]:
    """
    Sort products by collection priority.

    Priority:
    1. No stored SoldComps evidence.
    2. No successful sync timestamp.
    3. Stale products, oldest successful
       sync first.
    """
    last_successful_at = (
        candidate[
            "last_successful_at"
        ]
    )

    oldest_possible = (
        datetime.min.replace(
            tzinfo=UTC,
        )
    )

    return (
        int(
            candidate[
                "priority"
            ]
        ),
        (
            last_successful_at
            if last_successful_at
            is not None
            else oldest_possible
        ),
        int(
            candidate[
                "product_id"
            ]
        ),
    )


def collect_soldcomps_sales(
    *,
    count_per_product: int = 50,
    product_id: int | None = None,
    force: bool = False,
) -> dict:
    """
    Collect SoldComps eBay sold evidence for
    configured TCGMVP products.

    Request-aware behavior:

    - Account-wide quota exhaustion creates a
      provider-wide cooldown.
    - Products without stored SoldComps evidence
      receive highest priority.
    - Products without successful sync timestamps
      are collected next.
    - Existing products become eligible after the
      configured refresh interval.
    - Fresh products are skipped.
    - A per-run product budget limits provider use.
    - Successful API checks are recorded even if
      zero new transactions are returned.
    - Normal failures are recorded and collection
      continues.
    - Quota exhaustion stops all additional
      SoldComps requests for the run.
    - Stored evidence is never removed.

    If product_id is supplied, only that configured
    product is considered.

    force=True bypasses provider cooldown and product
    freshness scheduling. This should be used only
    intentionally.
    """
    products = (
        get_ebay_import_products()
    )

    if product_id is not None:
        products = [
            product
            for product in products
            if int(
                product[
                    "tcgmvp_product_id"
                ]
            )
            == product_id
        ]

        if not products:
            raise LookupError(
                "No active configured product "
                f"found for product_id={product_id}."
            )

    summary = {
        "products_considered":
            len(products),

        "products_eligible":
            0,

        "products_skipped_fresh":
            0,

        "products_skipped_provider_cooldown":
            0,

        "products_skipped_budget":
            0,

        "products_attempted":
            0,

        "products_successful":
            0,

        "products_failed":
            0,

        "sales_processed":
            0,

        "quota_exhausted":
            False,

        "provider_cooldown_active":
            False,

        "results":
            [],
    }


    (
        provider_cooldown_active,
        provider_cooldown_remaining_hours,
        last_quota_attempt_at,
    ) = (
        _get_provider_quota_cooldown_state()
    )


    if (
        provider_cooldown_active
        and not force
    ):
        summary[
            "provider_cooldown_active"
        ] = True

        summary[
            "quota_exhausted"
        ] = True

        summary[
            "products_skipped_provider_cooldown"
        ] = len(
            products
        )

        print(
            "SoldComps provider quota cooldown "
            "is active."
        )

        print(
            "Skipping all SoldComps collection "
            "for this pipeline run."
        )

        print(
            "Retry in about "
            f"{provider_cooldown_remaining_hours:.1f}h."
        )

        if (
            last_quota_attempt_at
            is not None
        ):
            print(
                "Last quota-exhausted attempt: "
                f"{last_quota_attempt_at.isoformat()}"
            )

        print("")

        for product in products:
            current_product_id = int(
                product[
                    "tcgmvp_product_id"
                ]
            )

            product_name = str(
                product[
                    "name"
                ]
            ).strip()

            summary[
                "results"
            ].append(
                {
                    "product_id":
                        current_product_id,

                    "name":
                        product_name,

                    "status":
                        (
                            "skipped_provider_"
                            "cooldown"
                        ),

                    "reason":
                        (
                            "SoldComps account quota "
                            "cooldown is active"
                        ),
                }
            )

        return summary


    candidates = [
        _build_collection_candidate(
            product
        )
        for product in products
    ]

    candidates.sort(
        key=_candidate_sort_key,
    )

    eligible_candidates: list[
        dict[str, Any]
    ] = []


    print(
        "SoldComps collection planning:"
    )

    print(
        "  Refresh interval: "
        f"{SOLDCOMPS_REFRESH_HOURS}h"
    )

    print(
        "  Provider quota cooldown: "
        f"{SOLDCOMPS_QUOTA_COOLDOWN_HOURS}h"
    )

    print(
        "  Max products per run: "
        f"{SOLDCOMPS_MAX_PRODUCTS_PER_RUN}"
    )

    if force:
        print(
            "  Force mode: ON"
        )

    print("")


    for candidate in candidates:
        product = (
            candidate[
                "product"
            ]
        )

        name = str(
            product[
                "name"
            ]
        ).strip()

        if (
            candidate[
                "eligible"
            ]
            or force
        ):
            eligible_candidates.append(
                candidate
            )

            summary[
                "products_eligible"
            ] += 1

            print(
                f"  ELIGIBLE: {name} "
                f"— {candidate['reason']}"
            )

        else:
            summary[
                "products_skipped_fresh"
            ] += 1

            print(
                f"  SKIP: {name} "
                f"— {candidate['reason']}"
            )

            summary[
                "results"
            ].append(
                {
                    "product_id":
                        candidate[
                            "product_id"
                        ],

                    "name":
                        name,

                    "status":
                        "skipped_fresh",

                    "reason":
                        candidate[
                            "reason"
                        ],
                }
            )

    print("")


    selected_candidates = (
        eligible_candidates[
            :SOLDCOMPS_MAX_PRODUCTS_PER_RUN
        ]
    )

    budget_skipped = (
        eligible_candidates[
            SOLDCOMPS_MAX_PRODUCTS_PER_RUN:
        ]
    )


    for candidate in budget_skipped:
        product = (
            candidate[
                "product"
            ]
        )

        name = str(
            product[
                "name"
            ]
        ).strip()

        summary[
            "products_skipped_budget"
        ] += 1

        summary[
            "results"
        ].append(
            {
                "product_id":
                    candidate[
                        "product_id"
                    ],

                "name":
                    name,

                "status":
                    "skipped_budget",

                "reason":
                    (
                        "per-run SoldComps "
                        "product budget reached"
                    ),
            }
        )

        print(
            f"  BUDGET SKIP: {name}"
        )


    if budget_skipped:
        print("")


    if not selected_candidates:
        print(
            "No SoldComps products require "
            "collection in this run."
        )

        return summary


    for candidate in selected_candidates:
        product = (
            candidate[
                "product"
            ]
        )

        current_product_id = int(
            candidate[
                "product_id"
            ]
        )

        product_name = str(
            product[
                "name"
            ]
        ).strip()

        summary[
            "products_attempted"
        ] += 1


        print("=" * 70)

        print(
            "Collecting SoldComps: "
            f"{product_name}"
        )

        print(
            "Product ID: "
            f"{current_product_id}"
        )

        print(
            "Query: "
            f"{product['query']}"
        )

        print(
            "Scheduling reason: "
            f"{candidate['reason']}"
        )


        attempted_at = (
            _utc_now()
        )


        try:
            _upsert_sync_state(
                product_id=(
                    current_product_id
                ),
                last_attempted_at=(
                    attempted_at
                ),
                last_status=(
                    "running"
                ),
                last_error=None,
            )


            reference_price = (
                _get_reference_price(
                    product_id=(
                        current_product_id
                    ),
                )
            )

            print(
                "Reference price: "
                f"${reference_price}"
            )


            (
                sold_after,
                collection_mode,
            ) = (
                _get_incremental_sold_after(
                    product_id=(
                        current_product_id
                    ),
                )
            )

            print(
                "Collection mode: "
                f"{collection_mode}"
            )

            print(
                "Sold after: "
                f"{sold_after}"
            )


            sales = (
                fetch_sold_booster_box_sales(
                    query=(
                        product[
                            "query"
                        ]
                    ),
                    product_keywords=(
                        product[
                            "product_keywords"
                        ]
                    ),
                    reference_price=(
                        reference_price
                    ),
                    sold_after=(
                        sold_after
                    ),
                    count=(
                        count_per_product
                    ),
                    page=1,
                )
            )


            print(
                "Valid sold comps found: "
                f"{len(sales)}"
            )


            processed = (
                upsert_soldcomps_sales(
                    product_id=(
                        current_product_id
                    ),
                    sales=sales,
                )
            )


            print(
                "Sales processed: "
                f"{processed}"
            )


            successful_at = (
                _utc_now()
            )


            _upsert_sync_state(
                product_id=(
                    current_product_id
                ),
                last_attempted_at=(
                    attempted_at
                ),
                last_successful_at=(
                    successful_at
                ),
                last_status=(
                    "success"
                ),
                last_error=None,
            )


            print(
                "Sync state: success"
            )


            summary[
                "products_successful"
            ] += 1

            summary[
                "sales_processed"
            ] += processed


            summary[
                "results"
            ].append(
                {
                    "product_id":
                        current_product_id,

                    "name":
                        product_name,

                    "status":
                        "success",

                    "reference_price":
                        str(
                            reference_price
                        ),

                    "collection_mode":
                        collection_mode,

                    "sold_after":
                        sold_after,

                    "sales_processed":
                        processed,

                    "last_successful_at":
                        successful_at.isoformat(),
                }
            )


        except SoldCompsQuotaExhaustedError as exc:
            summary[
                "products_failed"
            ] += 1

            summary[
                "quota_exhausted"
            ] = True

            summary[
                "provider_cooldown_active"
            ] = True


            _upsert_sync_state(
                product_id=(
                    current_product_id
                ),
                last_attempted_at=(
                    attempted_at
                ),
                last_status=(
                    "quota_exhausted"
                ),
                last_error=(
                    str(exc)
                ),
            )


            summary[
                "results"
            ].append(
                {
                    "product_id":
                        current_product_id,

                    "name":
                        product_name,

                    "status":
                        "failed",

                    "failure_type":
                        "quota_exhausted",

                    "error":
                        str(exc),
                }
            )


            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )

            print("")

            print(
                "SoldComps account quota "
                "is exhausted."
            )

            print(
                "Provider-wide cooldown "
                "has been recorded."
            )

            print(
                "Skipping all remaining "
                "SoldComps products for "
                "this pipeline run."
            )

            break


        except Exception as exc:
            summary[
                "products_failed"
            ] += 1


            _upsert_sync_state(
                product_id=(
                    current_product_id
                ),
                last_attempted_at=(
                    attempted_at
                ),
                last_status=(
                    "failed"
                ),
                last_error=(
                    str(exc)
                ),
            )


            summary[
                "results"
            ].append(
                {
                    "product_id":
                        current_product_id,

                    "name":
                        product_name,

                    "status":
                        "failed",

                    "error":
                        str(exc),
                }
            )


            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )


        print("")


    return summary