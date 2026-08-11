from __future__ import annotations

from scripts.marketplace.supabase_client import get_supabase_client


TCGPLAYER_MARKETPLACE_ID = 2


def get_product_identifier(
    product_id: int,
    identifier_type: str,
    marketplace_id: int = TCGPLAYER_MARKETPLACE_ID,
) -> str:
    supabase = get_supabase_client()

    response = (
        supabase.table("product_identifiers")
        .select("identifier_value")
        .eq("product_id", product_id)
        .eq("marketplace_id", marketplace_id)
        .eq("identifier_type", identifier_type)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise LookupError(
            f"No {identifier_type} found for product_id={product_id}."
        )

    return str(response.data[0]["identifier_value"])


def get_tcgplayer_id(product_id: int) -> str:
    return get_product_identifier(
        product_id,
        "tcgplayer_id",
    )


def get_tcgcsv_group_id(product_id: int) -> str:
    return get_product_identifier(
        product_id,
        "tcgcsv_group_id",
    )