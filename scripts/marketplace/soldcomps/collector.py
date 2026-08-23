from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

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
        .table("product_market_summary")
        .select("current_market_price")
        .eq("product_id", product_id)
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


def _get_incremental_sold_after(
    *,
    product_id: int,
) -> tuple[str, str]:
    """
    Determine how far back SoldComps should search.

    First collection:
        search the rolling 30-day window.

    Existing product:
        start two days before the newest stored
        SoldComps transaction.

    The overlap helps recover transactions that
    may appear late or were missed during a
    previous collection.

    Returns:
        (sold_after, collection_mode)
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table("market_sales")
        .select("sold_at")
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
            "soldcomps",
        )
        .order(
            "sold_at",
            desc=True,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        sold_after = (
            datetime.now(UTC)
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

    newest_value = rows[0].get(
        "sold_at"
    )

    if not newest_value:
        sold_after = (
            datetime.now(UTC)
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

    normalized_value = str(
        newest_value
    ).replace(
        "Z",
        "+00:00",
    )

    newest_sale = (
        datetime.fromisoformat(
            normalized_value
        )
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


def collect_soldcomps_sales(
    *,
    count_per_product: int = 50,
    product_id: int | None = None,
) -> dict:
    """
    Collect SoldComps eBay sold evidence for
    configured TCGMVP products.

    If product_id is provided, only that product
    is collected.

    Existing products use incremental retrieval:
    only transactions newer than the latest stored
    sale, plus a small overlap window, are requested.

    A product without stored SoldComps evidence
    receives an initial rolling 30-day backfill.

    A normal product failure does not stop the
    remaining products.

    SoldComps quota exhaustion stops additional
    SoldComps requests for the current pipeline run
    while preserving all previously stored evidence.
    """
    products = get_ebay_import_products()

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
        "products_attempted": 0,
        "products_successful": 0,
        "products_failed": 0,
        "sales_processed": 0,
        "results": [],
    }

    for product in products:
        current_product_id = int(
            product[
                "tcgmvp_product_id"
            ]
        )

        product_name = product["name"]

        summary[
            "products_attempted"
        ] += 1

        print("=" * 70)

        print(
            f"Collecting SoldComps: "
            f"{product_name}"
        )

        print(
            f"Product ID: "
            f"{current_product_id}"
        )

        print(
            f"Query: "
            f"{product['query']}"
        )

        try:
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
            ) = _get_incremental_sold_after(
                product_id=(
                    current_product_id
                ),
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
                    query=product["query"],
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

            summary[
                "products_successful"
            ] += 1

            summary[
                "sales_processed"
            ] += processed

            summary["results"].append(
                {
                    "product_id": (
                        current_product_id
                    ),
                    "name": (
                        product_name
                    ),
                    "status": (
                        "success"
                    ),
                    "reference_price": (
                        str(
                            reference_price
                        )
                    ),
                    "collection_mode": (
                        collection_mode
                    ),
                    "sold_after": (
                        sold_after
                    ),
                    "sales_processed": (
                        processed
                    ),
                }
            )

        except SoldCompsQuotaExhaustedError as exc:
            summary[
                "products_failed"
            ] += 1

            summary["results"].append(
                {
                    "product_id": (
                        current_product_id
                    ),
                    "name": (
                        product_name
                    ),
                    "status": (
                        "failed"
                    ),
                    "error": (
                        str(exc)
                    ),
                }
            )

            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )

            print("")

            print(
                "SoldComps quota exhausted. "
                "Skipping remaining products "
                "for this pipeline run."
            )

            break

        except Exception as exc:
            summary[
                "products_failed"
            ] += 1

            summary["results"].append(
                {
                    "product_id": (
                        current_product_id
                    ),
                    "name": (
                        product_name
                    ),
                    "status": (
                        "failed"
                    ),
                    "error": (
                        str(exc)
                    ),
                }
            )

            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )

        print()

    return summary