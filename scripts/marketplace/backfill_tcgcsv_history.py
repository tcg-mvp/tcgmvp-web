from __future__ import annotations

import argparse
from datetime import date, timedelta
from decimal import Decimal

from scripts.marketplace.historical_products import (
    get_historical_import_products,
)
from scripts.marketplace.market_metrics import (
    save_historical_market_price,
)
from scripts.marketplace.tcgcsv_daily_archive import (
    fetch_daily_product_prices,
)


TCGPLAYER_MARKETPLACE_ID = 2


def backfill_history(
    *,
    start_date: date,
    end_date: date,
) -> None:
    products = get_historical_import_products()

    print("")
    print(f"Products found: {len(products)}")
    print(f"Backfill range: {start_date} → {end_date}")
    print("")

    current_date = start_date

    successful_days = 0
    failed_days = 0
    saved_metrics = 0

    while current_date <= end_date:
        print("=" * 50)
        print(f"Processing archive date: {current_date}")
        print("=" * 50)

        try:
            observations = fetch_daily_product_prices(
                archive_date=current_date,
                products=products,
            )

            print("")
            print(
                f"Observations found: {len(observations)}"
            )

            for observation in observations:
                market_price = observation["market_price"]

                if market_price is None:
                    print(
                        f"Skipping product "
                        f"{observation['tcgmvp_product_id']}: "
                        f"market price missing."
                    )
                    continue

                saved = save_historical_market_price(
                    product_id=int(
                        observation["tcgmvp_product_id"]
                    ),
                    marketplace_id=TCGPLAYER_MARKETPLACE_ID,
                    metric_date=observation["archive_date"],
                    market_price=Decimal(
                        str(market_price)
                    ),
                )

                print(
                    f"  Product "
                    f"{observation['tcgmvp_product_id']} "
                    f"→ ${market_price} "
                    f"→ metric ID {saved['id']}"
                )

                saved_metrics += 1

            successful_days += 1

        except Exception as exc:
            print("")
            print(
                f"FAILED archive date "
                f"{current_date}: {exc}"
            )

            failed_days += 1

        print("")

        current_date += timedelta(days=1)

    print("=" * 50)
    print("Backfill complete.")
    print(f"Successful archive days: {successful_days}")
    print(f"Failed archive days: {failed_days}")
    print(f"Metrics saved: {saved_metrics}")
    print("=" * 50)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill historical TCGCSV market prices."
    )

    parser.add_argument(
        "start_date",
        type=date.fromisoformat,
        help="Start date in YYYY-MM-DD format.",
    )

    parser.add_argument(
        "end_date",
        type=date.fromisoformat,
        help="End date in YYYY-MM-DD format.",
    )

    args = parser.parse_args()

    if args.end_date < args.start_date:
        parser.error(
            "end_date must be on or after start_date."
        )

    backfill_history(
        start_date=args.start_date,
        end_date=args.end_date,
    )


if __name__ == "__main__":
    main()