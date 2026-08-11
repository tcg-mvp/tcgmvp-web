from __future__ import annotations

from datetime import date

from scripts.marketplace.tcgcsv_history import (
    fetch_historical_market_price,
)


def main() -> None:
    record = fetch_historical_market_price(
        archive_date=date(2024, 2, 8),
        group_id=2848,
        product_id="242436",
    )

    print("")
    print("TCGCSV historical test successful.")
    print(f"Product ID: {record['productId']}")
    print(f"Market Price: ${record['marketPrice']}")
    print(f"Low Price: ${record['lowPrice']}")
    print(f"Mid Price: ${record['midPrice']}")
    print(f"High Price: ${record['highPrice']}")


if __name__ == "__main__":
    main()