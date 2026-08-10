from __future__ import annotations

from scripts.marketplace.supabase_client import get_supabase_client


def get_tcgplayer_id(product_id: int) -> str:
    supabase = get_supabase_client()

    response = (
        supabase.table("product_identifiers")
        .select("identifier_value")
        .eq("product_id", product_id)
        .eq("marketplace_id", 2)
        .eq("identifier_type", "tcgplayer_id")
        .limit(1)
        .execute()
    )

    if not response.data:
        raise LookupError(
            f"No TCGPlayer ID found for product_id={product_id}."
        )

    return str(response.data[0]["identifier_value"])