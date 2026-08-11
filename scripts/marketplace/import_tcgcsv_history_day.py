from __future__ import annotations

from datetime import date
from decimal import Decimal

from scripts.marketplace.market_metrics import (
    save_historical_market_price,
)
from scripts.marketplace.tcgcsv_daily_archive import (
    fetch_daily_product_prices,
)


TCGPLAYER_MARKETPLACE_ID = 2


def main() -> None:
    products = [
        {
            "tcgmvp_product_id": 1,
            "tcgplayer_id": "242436",
            "group_id": "2848",
        },
        {
            "tcgmvp_product_id": 2,
            "tcgplayer_id": "236258",
            "group_id": "2807",
        },
        {
            "tcgmvp_product_id": 3,
            "tcgplayer_id": "181698",
            "group_id": "2377",
        },
    ]

    archive_date = date(2024, 2, 8)

    observations = fetch_daily_product_prices(
        archive_date=archive_date,
        products=products,
    )

    print("")
    print(f"Saving {len(observations)} historical observations...")
    print("")

    successes = 0
    failures = 0

    for observation in observations:
        try:
            market_price = observation["market_price"]

            if market_price is None:
                raise ValueError("Historical market price is missing.")

            saved = save_historical_market_price(
                product_id=int(
                    observation["tcgmvp_product_id"]
                ),
                marketplace_id=TCGPLAYER_MARKETPLACE_ID,
                metric_date=observation["archive_date"],
                market_price=Decimal(str(market_price)),
            )

            print(
                f"Product {observation['tcgmvp_product_id']} "
                f"→ ${market_price} "
                f"→ metric ID {saved['id']} "
                f"→ SUCCESS"
            )

            successes += 1

        except Exception as exc:
            print(
                f"Product {observation['tcgmvp_product_id']} "
                f"→ FAILED: {exc}"
            )

            failures += 1

    print("")
    print("------------------------------")
    print("Historical import complete.")
    print(f"Successful: {successes}")
    print(f"Failed: {failures}")
    print("------------------------------")


if __name__ == "__main__":
    main()