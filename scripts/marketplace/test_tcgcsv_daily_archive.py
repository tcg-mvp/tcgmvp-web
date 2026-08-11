from __future__ import annotations

from datetime import date

from scripts.marketplace.tcgcsv_daily_archive import (
    fetch_daily_product_prices,
)


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

    observations = fetch_daily_product_prices(
        archive_date=date(2024, 2, 8),
        products=products,
    )

    print("")
    print("Daily archive test complete.")
    print(f"Observations found: {len(observations)}")
    print("")

    for observation in observations:
        print(
            f"TCGMVP product "
            f"{observation['tcgmvp_product_id']} "
            f"(TCGPlayer {observation['tcgplayer_id']}) "
            f"→ ${observation['market_price']}"
        )


if __name__ == "__main__":
    main()