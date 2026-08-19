from __future__ import annotations

from scripts.marketplace.ebay.listings import (
    fetch_active_booster_box_listings,
)


def main() -> None:
    print("")
    print("Testing normalized eBay listings...")
    print("")

    listings = fetch_active_booster_box_listings(
        query=(
            "Pokemon Chilling Reign Booster Box"
        ),
        product_keywords=(
            "chilling reign",
            "booster box",
        ),
        limit=50,
    )

    print(
        f"Normalized valid listings: "
        f"{len(listings)}"
    )
    print("")

    for index, listing in enumerate(
        listings[:10],
        start=1,
    ):
        print(f"--- Listing {index} ---")
        print(
            f"ID: "
            f"{listing['external_listing_id']}"
        )
        print(
            f"Title: "
            f"{listing['title']}"
        )
        print(
            f"Listing price: "
            f"{listing['listing_price']}"
        )
        print(
            f"Shipping: "
            f"{listing['shipping_price']}"
        )
        print(
            f"Total: "
            f"{listing['total_price']}"
        )
        print(
            f"Seller: "
            f"{listing['seller_name']}"
        )
        print("")


if __name__ == "__main__":
    main()