from __future__ import annotations

from decimal import Decimal

from scripts.marketplace.market_metrics import (
    save_historical_market_price,
)


def main() -> None:
    saved = save_historical_market_price(
        product_id=1,
        marketplace_id=2,
        metric_date="2024-02-08",
        market_price=Decimal("480.55"),
    )

    print("")
    print("Historical metric save successful.")
    print(f"ID: {saved['id']}")
    print(f"Product ID: {saved['product_id']}")
    print(f"Marketplace ID: {saved['marketplace_id']}")
    print(f"Metric Date: {saved['metric_date']}")
    print(f"Market Price: ${saved['market_price']}")


if __name__ == "__main__":
    main()