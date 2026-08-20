from __future__ import annotations

from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)
from scripts.marketplace.market_metrics import (
    save_ebay_sold_metrics,
)
from scripts.marketplace.soldcomps.sold_statistics import (
    calculate_verified_sold_statistics,
)


def main() -> None:
    print(
        "Testing verified SoldComps "
        "30-day statistics...\n"
    )

    products = (
        get_ebay_import_products()
    )

    for product in products:
        product_id = int(
            product[
                "tcgmvp_product_id"
            ]
        )

        print("=" * 70)
        print(
            product["name"]
        )
        print("=" * 70)

        statistics = (
            calculate_verified_sold_statistics(
                product_id=product_id,
                window_days=30,
            )
        )

        print(
            "Verified sales: "
            f"{statistics['sales_count']}"
        )

        print(
            "Sales volume: "
            f"{statistics['sales_volume']}"
        )

        print(
            "Average sale: "
            f"{statistics['average_sale_price']}"
        )

        print(
            "Median sale: "
            f"{statistics['median_sale_price']}"
        )

        print(
            "Low sale: "
            f"{statistics['low_sale_price']}"
        )

        print(
            "High sale: "
            f"{statistics['high_sale_price']}"
        )

        save_ebay_sold_metrics(
            product_id=product_id,
            sales_count=(
                statistics[
                    "sales_count"
                ]
            ),
            sales_volume=(
                statistics[
                    "sales_volume"
                ]
            ),
            average_sale_price=(
                statistics[
                    "average_sale_price"
                ]
            ),
            median_sale_price=(
                statistics[
                    "median_sale_price"
                ]
            ),
            low_sale_price=(
                statistics[
                    "low_sale_price"
                ]
            ),
            high_sale_price=(
                statistics[
                    "high_sale_price"
                ]
            ),
        )

        print(
            "Daily sold metrics saved."
        )

        print()


if __name__ == "__main__":
    main()