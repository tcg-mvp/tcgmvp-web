from __future__ import annotations

from scripts.marketplace.historical_products import (
    get_historical_import_products,
)


def main() -> None:
    products = get_historical_import_products()

    print("")
    print(f"Historical import products found: {len(products)}")
    print("")

    for product in products:
        print(
            f"TCGMVP product {product['tcgmvp_product_id']} "
            f"→ {product['name']} "
            f"→ TCGPlayer {product['tcgplayer_id']} "
            f"→ TCGCSV group {product['group_id']}"
        )


if __name__ == "__main__":
    main()