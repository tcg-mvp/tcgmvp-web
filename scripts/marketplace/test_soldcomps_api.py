from __future__ import annotations

from scripts.marketplace.soldcomps.sales import (
    fetch_sold_booster_box_sales,
)
from decimal import Decimal

def main() -> None:
    print(
        "Testing normalized SoldComps sales...\n"
    )

    sales = fetch_sold_booster_box_sales(
        query=(
            "Pokemon Evolving Skies "
            "Booster Box"
        ),
        product_keywords=(
            "evolving skies",
            "booster box",
        ),
        reference_price=Decimal("2453.22"),
        count=50,
        page=1,
    )

    exact_price_sales = [
        sale
        for sale in sales
        if sale["price_is_exact"]
    ]

    best_offer_sales = [
        sale
        for sale in sales
        if sale["best_offer_accepted"]
    ]

    unknown_shipping_sales = [
        sale
        for sale in sales
        if sale["shipping_price"] is None
    ]

    print(
        f"Valid booster-box sales: "
        f"{len(sales)}"
    )

    print(
        f"Exact-price sales: "
        f"{len(exact_price_sales)}"
    )

    print(
        f"Best Offer accepted: "
        f"{len(best_offer_sales)}"
    )

    print(
        f"Unknown shipping: "
        f"{len(unknown_shipping_sales)}"
    )

    print(
        "\nNormalized sold results:\n"
    )

    for index, sale in enumerate(
        sales,
        start=1,
    ):
        print("=" * 80)
        print(f"Sale {index}")
        print("=" * 80)

        print(
            f"ID: "
            f"{sale['external_sale_id']}"
        )
        print(
            f"Title: "
            f"{sale['title']}"
        )
        print(
            f"Sale price: "
            f"{sale['sale_price']}"
        )
        print(
            f"Shipping: "
            f"{sale['shipping_price']}"
        )
        print(
            f"Total: "
            f"{sale['total_price']}"
        )
        print(
            f"Format: "
            f"{sale['sale_type']}"
        )
        print(
            f"Category ID: "
            f"{sale['category_id']}"
        )

        print(
            f"Bid count: "
            f"{sale['bid_count']}"
        )
        print(
            f"Sold at: "
            f"{sale['sold_at']}"
        )
        print(
            f"Best Offer accepted: "
            f"{sale['best_offer_accepted']}"
        )
        print(
            f"Exact price: "
            f"{sale['price_is_exact']}"
        )
        print(
            f"Seller: "
            f"{sale['seller_name']}"
        )

        print()


if __name__ == "__main__":
    main()