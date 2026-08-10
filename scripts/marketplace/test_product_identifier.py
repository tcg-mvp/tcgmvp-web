from __future__ import annotations

from scripts.marketplace.product_identifiers import get_tcgplayer_id


def main() -> None:
    product_id = 2

    print("Starting Supabase identifier test...")
    print(f"Looking up product_id={product_id}...")

    tcgplayer_id = get_tcgplayer_id(product_id)

    print("Lookup returned.")
    print("")
    print("Supabase identifier lookup successful.")
    print(f"Product ID: {product_id}")
    print(f"TCGPlayer ID: {tcgplayer_id}")


if __name__ == "__main__":
    main()