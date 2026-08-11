from __future__ import annotations

from scripts.marketplace.historical_products import (
    get_historical_import_products,
)
from scripts.marketplace.market_summary_calculator import (
    update_calculated_market_summary,
)


def main() -> None:
    products = get_historical_import_products()

    print("")
    print(f"Products found: {len(products)}")
    print("")

    successes = 0
    failures = 0

    for product in products:
        product_id = int(
            product["tcgmvp_product_id"]
        )

        print(
            f"Updating {product['name']} "
            f"(product_id={product_id})"
        )

        try:
            summary = update_calculated_market_summary(
                product_id=product_id,
            )

            print(
                f"  Current: "
                f"${summary['current_market_price']}"
            )
            print(
                f"  7D: "
                f"{summary['change_7d_percent']}%"
            )
            print(
                f"  30D: "
                f"{summary['change_30d_percent']}%"
            )
            print(
                f"  90D: "
                f"{summary['change_90d_percent']}%"
            )
            print("  SUCCESS")
            print("")

            successes += 1

        except Exception as exc:
            print(f"  FAILED: {exc}")
            print("")
            failures += 1

    print("------------------------------")
    print("Market summary update complete.")
    print(f"Successful: {successes}")
    print(f"Failed: {failures}")
    print("------------------------------")


if __name__ == "__main__":
    main()