from __future__ import annotations

from decimal import Decimal
from pprint import pprint

from scripts.marketplace.soldcomps.sale_importer import (
    prepare_soldcomps_sale_row,
)
from scripts.marketplace.soldcomps.sales import (
    fetch_sold_booster_box_sales,
)


EVOLVING_SKIES_PRODUCT_ID = 1


def main() -> None:
    print(
        "Preparing Evolving Skies SoldComps "
        "rows without writing to Supabase...\n"
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

    rows = [
        prepare_soldcomps_sale_row(
            product_id=(
                EVOLVING_SKIES_PRODUCT_ID
            ),
            sale=sale,
        )
        for sale in sales
    ]

    print(
        f"Rows prepared: {len(rows)}"
    )

    print(
        "\nPrepared rows:\n"
    )

    for index, row in enumerate(
        rows,
        start=1,
    ):
        print("=" * 80)
        print(f"Row {index}")
        print("=" * 80)

        pprint(
            row,
            sort_dicts=False,
        )

        print()


if __name__ == "__main__":
    main()