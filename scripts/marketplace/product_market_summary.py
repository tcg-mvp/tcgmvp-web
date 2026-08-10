from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from scripts.marketplace.supabase_client import get_supabase_client


def update_product_market_summary(
    *,
    product_id: int,
    market_price: Decimal,
) -> dict:
    supabase = get_supabase_client()

    record = {
        "product_id": product_id,
        "current_market_price": str(market_price),
        "calculated_at": datetime.now(UTC).isoformat(),
    }

    response = (
        supabase.table("product_market_summary")
        .upsert(
            record,
            on_conflict="product_id",
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the updated product market summary."
        )

    return response.data[0]