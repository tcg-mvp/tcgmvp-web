from __future__ import annotations

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def get_historical_import_products() -> list[dict]:
    supabase = get_supabase_client()

    products_response = (
        supabase.table("products")
        .select("id,name")
        .eq("active", True)
        .eq("active_for_import", True)
        .order("id")
        .execute()
    )

    products = products_response.data or []

    historical_products: list[dict] = []

    for product in products:
        product_id = int(product["id"])

        identifiers_response = (
            supabase.table("product_identifiers")
            .select("identifier_type,identifier_value")
            .eq("product_id", product_id)
            .eq("marketplace_id", 2)
            .execute()
        )

        identifiers = {
            row["identifier_type"]: row["identifier_value"]
            for row in (identifiers_response.data or [])
        }

        tcgplayer_id = identifiers.get("tcgplayer_id")
        tcgcsv_group_id = identifiers.get("tcgcsv_group_id")

        if not tcgplayer_id or not tcgcsv_group_id:
            print(
                f"Skipping {product['name']} "
                f"(product_id={product_id}): "
                f"missing TCGPlayer or TCGCSV identifier."
            )
            continue

        historical_products.append(
            {
                "tcgmvp_product_id": product_id,
                "name": product["name"],
                "tcgplayer_id": str(tcgplayer_id),
                "group_id": str(tcgcsv_group_id),
            }
        )

    return historical_products