from __future__ import annotations

from decimal import Decimal

from scripts.marketplace.soldcomps.sale_importer import (
    upsert_soldcomps_sales,
)
from scripts.marketplace.soldcomps.sales import (
    fetch_sold_booster_box_sales,
)


EVOLVING_SKIES_PRODUCT_ID = 1


def main() -> None:
    print(
        "Fetching Evolving Skies SoldComps sales...\n"
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
        reference_price=Decimal(
            "2453.22"
        ),
        count=50,
        page=1,
    )

    print(
        f"Valid sales fetched: "
        f"{len(sales)}"
    )

    verified_count = sum(
        1
        for sale in sales
        if sale["price_is_exact"]
        and "booster boxes"
        not in sale["title"].lower()
    )

    print(
        f"Expected verified sales: "
        f"{verified_count}"
    )

    print(
        "\nWriting Evolving Skies sales "
        "to Supabase..."
    )

    imported_count = (
        upsert_soldcomps_sales(
            product_id=(
                EVOLVING_SKIES_PRODUCT_ID
            ),
            sales=sales,
        )
    )

    print(
        "\nUpsert complete."
    )

    print(
        f"Sales processed: "
        f"{imported_count}"
    )


if __name__ == "__main__":
    main()