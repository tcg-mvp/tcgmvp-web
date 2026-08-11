from __future__ import annotations

from scripts.marketplace.market_summary_calculator import (
    calculate_product_market_summary,
)


def main() -> None:
    for product_id in [1, 2, 3]:
        summary = calculate_product_market_summary(
            product_id=product_id,
        )

        print("")
        print("------------------------------")
        print(f"Product ID: {summary['product_id']}")
        print(
            f"Current Market Price: "
            f"${summary['current_market_price']}"
        )
        print(
            f"Previous Market Price: "
            f"${summary['previous_market_price']}"
        )
        print(
            f"7D Change: "
            f"{summary['change_7d_percent']}%"
        )
        print(
            f"30D Change: "
            f"{summary['change_30d_percent']}%"
        )
        print(
            f"90D Change: "
            f"{summary['change_90d_percent']}%"
        )

    print("")
    print("------------------------------")
    print("All market summary calculations successful.")


if __name__ == "__main__":
    main()