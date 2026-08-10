from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from scripts.marketplace.supabase_client import get_supabase_client


def save_market_price(
    *,
    product_id: int,
    marketplace_id: int,
    market_price: Decimal,
) -> dict:
    supabase = get_supabase_client()

    metric_date = datetime.now(UTC).date().isoformat()

    record = {
        "product_id": product_id,
        "marketplace_id": marketplace_id,
        "metric_date": metric_date,
        "market_price": str(market_price),
        "sales_count": 0,
        "sales_volume": 0,
    }

    response = (
        supabase.table("daily_market_metrics")
        .upsert(
            record,
            on_conflict="product_id,marketplace_id,metric_date",
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the saved market metric."
        )

    return response.data[0]