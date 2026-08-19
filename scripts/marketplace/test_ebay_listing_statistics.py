from __future__ import annotations

from scripts.marketplace.ebay.listing_statistics import (
    calculate_ebay_listing_statistics,
)
from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)


def main() -> None:
    print(
        "Testing eBay active listing statistics...\n"
    )

    products = get_ebay_import_products()

    for product in products:
        statistics = (
            calculate_ebay_listing_statistics(
                product_id=(
                    product["tcgmvp_product_id"]
                ),
                freshness_hours=24,
            )
        )

        print("=" * 70)
        print(product["name"])
        print("=" * 70)

        print(
            "Active listings: "
            f"{statistics['active_listing_count']}"
        )

        print(
            "Unique sellers: "
            f"{statistics['unique_seller_count']}"
        )

        print(
            "Known shipping: "
            f"{statistics['known_shipping_count']}"
        )

        print(
            "Unknown shipping: "
            f"{statistics['unknown_shipping_count']}"
        )

        print(
            "Best offer listings: "
            f"{statistics['best_offer_count']}"
        )

        print()

        print(
            "Lowest ask: "
            f"{statistics['min_listing_price']}"
        )

        print(
            "Median ask: "
            f"{statistics['median_listing_price']}"
        )

        print(
            "Highest ask: "
            f"{statistics['max_listing_price']}"
        )

        print()

        print(
            "Delivered-price sample: "
            f"{statistics['delivered_price_sample_size']}"
        )

        print(
            "Lowest delivered: "
            f"{statistics['min_delivered_price']}"
        )

        print(
            "Median delivered: "
            f"{statistics['median_delivered_price']}"
        )

        print(
            "Highest delivered: "
            f"{statistics['max_delivered_price']}"
        )

        print()


if __name__ == "__main__":
    main()