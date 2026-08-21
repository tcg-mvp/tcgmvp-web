from __future__ import annotations

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


EBAY_MARKETPLACE = "ebay"


def get_ebay_import_products() -> list[dict]:
    """
    Return active TCGMVP products configured
    for eBay collection.

    Supabase is authoritative for:
    - product ID
    - product name
    - product slug
    - whether the product is active
    - whether the product is active for import
    - eBay search query
    - eBay product-matching keywords

    No product-specific eBay configuration
    should live in Python.
    """
    supabase = get_supabase_client()

    products_response = (
        supabase
        .table("products")
        .select(
            "id,"
            "name,"
            "slug"
        )
        .eq(
            "active",
            True,
        )
        .eq(
            "active_for_import",
            True,
        )
        .order("id")
        .execute()
    )

    products = (
        products_response.data
        or []
    )

    ebay_products: list[dict] = []

    for product in products:
        product_id = int(
            product["id"]
        )

        config_response = (
            supabase
            .table(
                "product_marketplace_config"
            )
            .select(
                "search_query,"
                "product_keywords"
            )
            .eq(
                "product_id",
                product_id,
            )
            .eq(
                "marketplace",
                EBAY_MARKETPLACE,
            )
            .eq(
                "active",
                True,
            )
            .limit(1)
            .execute()
        )

        config_rows = (
            config_response.data
            or []
        )

        if not config_rows:
            print(
                f"Skipping "
                f"{product['name']} "
                f"(product_id="
                f"{product_id}): "
                "no active eBay "
                "marketplace configuration."
            )

            continue

        config = (
            config_rows[0]
        )

        search_query = (
            config.get(
                "search_query"
            )
        )

        product_keywords = (
            config.get(
                "product_keywords"
            )
            or []
        )

        if (
            not search_query
            or not product_keywords
        ):
            print(
                f"Skipping "
                f"{product['name']} "
                f"(product_id="
                f"{product_id}): "
                "incomplete eBay "
                "marketplace configuration."
            )

            continue

        ebay_products.append(
            {
                "tcgmvp_product_id":
                    product_id,

                "name":
                    product["name"],

                "slug":
                    product["slug"],

                "query":
                    str(
                        search_query
                    ),

                "product_keywords":
                    tuple(
                        str(keyword)
                        for keyword
                        in product_keywords
                    ),
            }
        )

    return ebay_products