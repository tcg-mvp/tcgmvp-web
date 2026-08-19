from __future__ import annotations

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


EBAY_PRODUCT_CONFIG = {
    "evolving-skies-booster-box-english": {
        "query": "Pokemon Evolving Skies Booster Box",
        "product_keywords": (
            "evolving skies",
            "booster box",
        ),
    },
    "chilling-reign-booster-box-english": {
        "query": "Pokemon Chilling Reign Booster Box",
        "product_keywords": (
            "chilling reign",
            "booster box",
        ),
    },
    "team-up-booster-box-english": {
        "query": "Pokemon Team Up Booster Box",
        "product_keywords": (
            "team up",
            "booster box",
        ),
    },
}


def get_ebay_import_products() -> list[dict]:
    """
    Return active TCGMVP products that have an
    eBay collection configuration.

    Supabase remains authoritative for:
    - product ID
    - product name
    - product slug
    - whether the product is active for import

    Python configuration contains only the
    eBay-specific search and matching rules.
    """
    supabase = get_supabase_client()

    products_response = (
        supabase.table("products")
        .select("id,name,slug")
        .eq("active", True)
        .eq("active_for_import", True)
        .order("id")
        .execute()
    )

    products = products_response.data or []

    ebay_products: list[dict] = []

    for product in products:
        slug = product["slug"]

        config = EBAY_PRODUCT_CONFIG.get(slug)

        if not config:
            print(
                f"Skipping {product['name']} "
                f"(product_id={product['id']}): "
                "no eBay import configuration."
            )
            continue

        ebay_products.append(
            {
                "tcgmvp_product_id": int(
                    product["id"]
                ),
                "name": product["name"],
                "slug": slug,
                "query": config["query"],
                "product_keywords": (
                    config["product_keywords"]
                ),
            }
        )

    return ebay_products