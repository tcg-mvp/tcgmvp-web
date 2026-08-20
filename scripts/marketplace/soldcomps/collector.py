from __future__ import annotations

from decimal import Decimal

from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)
from scripts.marketplace.soldcomps.sale_importer import (
    upsert_soldcomps_sales,
)
from scripts.marketplace.soldcomps.sales import (
    fetch_sold_booster_box_sales,
)
from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def _get_reference_price(
    *,
    product_id: int,
) -> Decimal:
    """
    Load the canonical TCGMVP reference price for
    a product from product_market_summary.

    This remains TCGPlayer/TCGCSV-derived evidence.
    """
    supabase = get_supabase_client()

    response = (
        supabase
        .table("product_market_summary")
        .select("current_market_price")
        .eq("product_id", product_id)
        .single()
        .execute()
    )

    row = response.data

    if not row:
        raise LookupError(
            f"No market summary found for "
            f"product_id={product_id}."
        )

    value = row.get(
        "current_market_price"
    )

    if value is None:
        raise LookupError(
            f"No current market price found for "
            f"product_id={product_id}."
        )

    reference_price = Decimal(
        str(value)
    )

    if reference_price <= 0:
        raise ValueError(
            f"Invalid reference price for "
            f"product_id={product_id}: "
            f"{reference_price}"
        )

    return reference_price


def collect_soldcomps_sales(
    *,
    count_per_product: int = 50,
) -> dict:
    """
    Collect SoldComps eBay sold evidence for all
    configured TCGMVP products.

    Flow:
        canonical TCGMVP products
        -> current reference price
        -> SoldComps search
        -> product / price validation
        -> market_sales upsert

    A failure for one product does not stop the
    remaining products.
    """
    products = get_ebay_import_products()

    summary = {
        "products_attempted": 0,
        "products_successful": 0,
        "products_failed": 0,
        "sales_processed": 0,
        "results": [],
    }

    for product in products:
        product_id = int(
            product["tcgmvp_product_id"]
        )

        product_name = product["name"]

        summary[
            "products_attempted"
        ] += 1

        print("=" * 70)
        print(
            f"Collecting SoldComps: "
            f"{product_name}"
        )
        print(
            f"Product ID: "
            f"{product_id}"
        )
        print(
            f"Query: "
            f"{product['query']}"
        )

        try:
            reference_price = (
                _get_reference_price(
                    product_id=product_id,
                )
            )

            print(
                "Reference price: "
                f"${reference_price}"
            )

            sales = (
                fetch_sold_booster_box_sales(
                    query=product["query"],
                    product_keywords=(
                        product[
                            "product_keywords"
                        ]
                    ),
                    reference_price=(
                        reference_price
                    ),
                    count=count_per_product,
                    page=1,
                )
            )

            print(
                "Valid sold comps found: "
                f"{len(sales)}"
            )

            processed = (
                upsert_soldcomps_sales(
                    product_id=product_id,
                    sales=sales,
                )
            )

            print(
                "Sales processed: "
                f"{processed}"
            )

            summary[
                "products_successful"
            ] += 1

            summary[
                "sales_processed"
            ] += processed

            summary["results"].append(
                {
                    "product_id": (
                        product_id
                    ),
                    "name": (
                        product_name
                    ),
                    "status": (
                        "success"
                    ),
                    "reference_price": (
                        str(
                            reference_price
                        )
                    ),
                    "sales_processed": (
                        processed
                    ),
                }
            )

        except Exception as exc:
            summary[
                "products_failed"
            ] += 1

            summary["results"].append(
                {
                    "product_id": (
                        product_id
                    ),
                    "name": (
                        product_name
                    ),
                    "status": (
                        "failed"
                    ),
                    "error": (
                        str(exc)
                    ),
                }
            )

            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )

        print()

    return summary