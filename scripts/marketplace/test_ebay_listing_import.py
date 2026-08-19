from __future__ import annotations

from scripts.marketplace.ebay.listing_importer import (
    upsert_ebay_listings,
)
from scripts.marketplace.ebay.listings import (
    fetch_active_booster_box_listings,
)


EVOLVING_SKIES_PRODUCT_ID = 1


def main() -> None:
    print(
        "Fetching Evolving Skies eBay listings..."
    )

    listings = (
        fetch_active_booster_box_listings(
            query=(
                "Pokemon Evolving Skies "
                "Booster Box"
            ),
            product_keywords=(
                "evolving skies",
                "booster box",
            ),
            limit=50,
        )
    )

    print(
        f"Valid listings fetched: "
        f"{len(listings)}"
    )

    print(
        "\nWriting Evolving Skies listings "
        "to Supabase..."
    )

    imported_count = upsert_ebay_listings(
        product_id=(
            EVOLVING_SKIES_PRODUCT_ID
        ),
        listings=listings,
    )

    print(
        f"\nUpsert complete."
    )

    print(
        f"Listings processed: "
        f"{imported_count}"
    )


if __name__ == "__main__":
    main()