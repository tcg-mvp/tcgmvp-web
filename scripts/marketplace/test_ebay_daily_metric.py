from __future__ import annotations

from scripts.marketplace.ebay.listing_statistics import (
    calculate_ebay_listing_statistics,
)
from scripts.marketplace.market_metrics import (
    save_ebay_listing_metrics,
)


EVOLVING_SKIES_PRODUCT_ID = 1


def main() -> None:
    print(
        "Calculating Evolving Skies eBay listing statistics...\n"
    )

    statistics = calculate_ebay_listing_statistics(
        product_id=EVOLVING_SKIES_PRODUCT_ID,
        freshness_hours=24,
    )

    print(
        "Active listings: "
        f"{statistics['active_listing_count']}"
    )

    print(
        "Median ask: "
        f"{statistics['median_listing_price']}"
    )

    print(
        "Median delivered: "
        f"{statistics['median_delivered_price']}"
    )

    print(
        "\nSaving eBay daily metric..."
    )

    saved = save_ebay_listing_metrics(
        product_id=EVOLVING_SKIES_PRODUCT_ID,
        active_listing_count=(
            statistics["active_listing_count"]
        ),
        unique_seller_count=(
            statistics["unique_seller_count"]
        ),
        known_shipping_count=(
            statistics["known_shipping_count"]
        ),
        unknown_shipping_count=(
            statistics["unknown_shipping_count"]
        ),
        best_offer_count=(
            statistics["best_offer_count"]
        ),
        lowest_listing_price=(
            statistics["min_listing_price"]
        ),
        median_listing_price=(
            statistics["median_listing_price"]
        ),
        highest_listing_price=(
            statistics["max_listing_price"]
        ),
        delivered_price_sample_size=(
            statistics["delivered_price_sample_size"]
        ),
        lowest_delivered_price=(
            statistics["min_delivered_price"]
        ),
        median_delivered_price=(
            statistics["median_delivered_price"]
        ),
        highest_delivered_price=(
            statistics["max_delivered_price"]
        ),
    )

    print("\nSaved daily metric:")
    print(
        f"ID: {saved['id']}"
    )
    print(
        f"Product ID: {saved['product_id']}"
    )
    print(
        f"Marketplace ID: {saved['marketplace_id']}"
    )
    print(
        f"Metric date: {saved['metric_date']}"
    )
    print(
        f"Active listings: "
        f"{saved['active_listing_count']}"
    )
    print(
        f"Median listing price: "
        f"{saved['median_listing_price']}"
    )


if __name__ == "__main__":
    main()