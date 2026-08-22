from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from scripts.marketplace.historical_products import (
    get_historical_import_products,
)
from scripts.marketplace.market_metrics import (
    save_historical_market_price,
)
from scripts.marketplace.supabase_client import (
    get_supabase_client,
)
from scripts.marketplace.tcgcsv_daily_archive import (
    fetch_daily_product_prices,
)


TCGPLAYER_MARKETPLACE_ID = 2

REQUIRED_HISTORY_START_DATE = date(
    2024,
    2,
    8,
)

HISTORY_QUERY_PAGE_SIZE = 1000


def load_existing_history(
    *,
    product_ids: list[int],
    start_date: date,
    end_date: date,
) -> dict[str, set[int]]:
    """
    Load existing TCGPlayer/TCGCSV historical
    observations for all tracked products.

    Returns:
        {
            "2024-02-08": {1, 2, 3},
            "2024-02-09": {1, 2},
            ...
        }

    Loading this once avoids making one Supabase
    query for every product/date combination.
    """
    if not product_ids:
        return {}

    supabase = get_supabase_client()

    existing_by_date: dict[
        str,
        set[int],
    ] = defaultdict(set)

    offset = 0

    while True:
        response = (
            supabase
            .table("daily_market_metrics")
            .select(
                "product_id,"
                "metric_date,"
                "market_price"
            )
            .eq(
                "marketplace_id",
                TCGPLAYER_MARKETPLACE_ID,
            )
            .in_(
                "product_id",
                product_ids,
            )
            .gte(
                "metric_date",
                start_date.isoformat(),
            )
            .lte(
                "metric_date",
                end_date.isoformat(),
            )
            .not_.is_(
                "market_price",
                "null",
            )
            .order(
                "metric_date",
                desc=False,
            )
            .range(
                offset,
                offset
                + HISTORY_QUERY_PAGE_SIZE
                - 1,
            )
            .execute()
        )

        rows = response.data or []

        for row in rows:
            product_id = row.get(
                "product_id"
            )

            metric_date = row.get(
                "metric_date"
            )

            if (
                product_id is None
                or metric_date is None
            ):
                continue

            existing_by_date[
                str(metric_date)
            ].add(
                int(product_id)
            )

        if (
            len(rows)
            < HISTORY_QUERY_PAGE_SIZE
        ):
            break

        offset += (
            HISTORY_QUERY_PAGE_SIZE
        )

    return dict(
        existing_by_date
    )


def seed_missing_history(
    *,
    required_start_date: date = (
        REQUIRED_HISTORY_START_DATE
    ),
) -> dict:
    """
    Fill missing TCGCSV historical market-price
    observations for all active import products.

    Important optimization:

    The process is DATE-CENTRIC rather than
    PRODUCT-CENTRIC.

    For each historical date:
        1. Determine which products are missing.
        2. If none are missing, skip the date.
        3. Download that TCGCSV archive once.
        4. Extract prices for every missing product.
        5. Save all observations.

    This prevents downloading the same historical
    archive once for every product.
    """
    products = (
        get_historical_import_products()
    )

    end_date = (
        datetime.now(UTC).date()
        - timedelta(days=1)
    )

    if end_date < required_start_date:
        raise ValueError(
            "Historical end date is before "
            "the required start date."
        )

    product_ids = [
        int(
            product[
                "tcgmvp_product_id"
            ]
        )
        for product in products
    ]

    products_by_id = {
        int(
            product[
                "tcgmvp_product_id"
            ]
        ): product
        for product in products
    }

    print("")
    print(
        "TCGMVP TCGCSV HISTORICAL SEED"
    )
    print("=" * 70)

    print(
        "Products tracked: "
        f"{len(products)}"
    )

    print(
        "Required history: "
        f"{required_start_date} "
        f"→ {end_date}"
    )

    print("")

    print(
        "Loading existing historical "
        "coverage from Supabase..."
    )

    existing_by_date = (
        load_existing_history(
            product_ids=product_ids,
            start_date=required_start_date,
            end_date=end_date,
        )
    )

    print(
        "Existing historical coverage "
        "loaded."
    )

    print("")

    current_date = (
        required_start_date
    )

    days_checked = 0
    complete_days_skipped = 0
    archive_days_downloaded = 0
    failed_days = 0
    metrics_saved = 0
    missing_observations = 0

    saved_by_product: dict[
        int,
        int,
    ] = {
        product_id: 0
        for product_id in product_ids
    }

    failed_date_details: list[
        dict
    ] = []

    while current_date <= end_date:
        days_checked += 1

        date_string = (
            current_date.isoformat()
        )

        existing_product_ids = (
            existing_by_date.get(
                date_string,
                set(),
            )
        )

        missing_product_ids = [
            product_id
            for product_id in product_ids
            if (
                product_id
                not in existing_product_ids
            )
        ]

        if not missing_product_ids:
            complete_days_skipped += 1

            current_date += timedelta(
                days=1
            )

            continue

        missing_products = [
            products_by_id[
                product_id
            ]
            for product_id
            in missing_product_ids
        ]

        print("=" * 70)
        print(
            f"Historical date: "
            f"{current_date}"
        )
        print(
            "Products missing: "
            f"{len(missing_products)}"
        )

        for product in missing_products:
            print(
                "  - "
                f"{product['name']} "
                f"(product_id="
                f"{product['tcgmvp_product_id']})"
            )

        print("=" * 70)

        try:
            observations = (
                fetch_daily_product_prices(
                    archive_date=(
                        current_date
                    ),
                    products=(
                        missing_products
                    ),
                )
            )

            archive_days_downloaded += 1

            observation_product_ids: set[
                int
            ] = set()

            for observation in observations:
                product_id = int(
                    observation[
                        "tcgmvp_product_id"
                    ]
                )

                observation_product_ids.add(
                    product_id
                )

                market_price = (
                    observation.get(
                        "market_price"
                    )
                )

                if market_price is None:
                    print(
                        "  Missing market price "
                        f"for product_id="
                        f"{product_id}"
                    )

                    missing_observations += 1
                    continue

                saved = (
                    save_historical_market_price(
                        product_id=(
                            product_id
                        ),
                        marketplace_id=(
                            TCGPLAYER_MARKETPLACE_ID
                        ),
                        metric_date=(
                            date_string
                        ),
                        market_price=Decimal(
                            str(
                                market_price
                            )
                        ),
                    )
                )

                print(
                    "  Saved "
                    f"product {product_id} "
                    f"→ ${market_price} "
                    f"→ metric ID "
                    f"{saved['id']}"
                )

                metrics_saved += 1

                saved_by_product[
                    product_id
                ] += 1

                existing_by_date.setdefault(
                    date_string,
                    set(),
                ).add(
                    product_id
                )

            missing_from_archive = (
                set(
                    missing_product_ids
                )
                - observation_product_ids
            )

            if missing_from_archive:
                missing_observations += len(
                    missing_from_archive
                )

                for product_id in sorted(
                    missing_from_archive
                ):
                    print(
                        "  No archive observation "
                        f"found for product_id="
                        f"{product_id}"
                    )

        except Exception as exc:
            failed_days += 1

            print(
                "FAILED archive date "
                f"{current_date}: "
                f"{exc}"
            )

            failed_date_details.append(
                {
                    "metric_date":
                        date_string,
                    "error":
                        str(exc),
                    "missing_product_ids":
                        missing_product_ids,
                }
            )

        print("")

        current_date += timedelta(
            days=1
        )

    print("=" * 70)
    print(
        "Historical seeding complete"
    )
    print("=" * 70)

    print(
        "Products checked: "
        f"{len(products)}"
    )

    print(
        "Days checked: "
        f"{days_checked}"
    )

    print(
        "Complete days skipped: "
        f"{complete_days_skipped}"
    )

    print(
        "Archive days downloaded: "
        f"{archive_days_downloaded}"
    )

    print(
        "Failed archive days: "
        f"{failed_days}"
    )

    print(
        "Metrics saved: "
        f"{metrics_saved}"
    )

    print(
        "Missing observations: "
        f"{missing_observations}"
    )

    print("")

    print(
        "Metrics saved by product:"
    )

    for product_id in product_ids:
        product = (
            products_by_id[
                product_id
            ]
        )

        print(
            "  "
            f"{product['name']}: "
            f"{saved_by_product[product_id]}"
        )

    return {
        "products_checked":
            len(products),

        "days_checked":
            days_checked,

        "complete_days_skipped":
            complete_days_skipped,

        "archive_days_downloaded":
            archive_days_downloaded,

        "failed_days":
            failed_days,

        "metrics_saved":
            metrics_saved,

        "missing_observations":
            missing_observations,

        "saved_by_product":
            saved_by_product,

        "failed_date_details":
            failed_date_details,
    }


def main() -> None:
    seed_missing_history()


if __name__ == "__main__":
    main()