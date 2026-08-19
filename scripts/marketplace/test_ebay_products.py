from __future__ import annotations

from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)


def main() -> None:
    print("Testing eBay import products...\n")

    products = get_ebay_import_products()

    print(
        f"Configured eBay products: "
        f"{len(products)}\n"
    )

    for product in products:
        print("=" * 70)

        print(
            f"Product ID: "
            f"{product['tcgmvp_product_id']}"
        )

        print(
            f"Name: "
            f"{product['name']}"
        )

        print(
            f"Slug: "
            f"{product['slug']}"
        )

        print(
            f"eBay query: "
            f"{product['query']}"
        )

        print(
            "Required keywords: "
            f"{product['product_keywords']}"
        )

        print()


if __name__ == "__main__":
    main()