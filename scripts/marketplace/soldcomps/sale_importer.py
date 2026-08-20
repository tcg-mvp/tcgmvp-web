from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def _serialize_value(
    value: Any,
) -> Any:
    if isinstance(value, Decimal):
        return str(value)

    return value


def _normalize_sold_at(
    value: str | None,
) -> str:
    if not value:
        raise ValueError(
            "SoldComps sale is missing endedAt."
        )

    parsed = datetime.strptime(
        value,
        "%Y-%m-%d",
    ).replace(
        tzinfo=UTC,
    )

    return parsed.isoformat()


def prepare_soldcomps_sale_row(
    *,
    product_id: int,
    sale: dict[str, Any],
) -> dict[str, Any]:
    external_sale_id = sale.get(
        "external_sale_id"
    )

    if not external_sale_id:
        raise ValueError(
            "Cannot import SoldComps sale without "
            "external_sale_id."
        )

    exact_price = bool(
        sale.get("price_is_exact")
    )

    normalized_title = (
        sale.get("title") or ""
    ).lower()

    ambiguous_quantity = (
        "booster boxes"
        in normalized_title
    )

    condition_warning_phrases = (
        "slit",
        "tear",
        "torn",
        "damaged",
        "damage",
        "ripped",
        "read description",
        "read descrip",
    )

    has_condition_warning = any(
        phrase in normalized_title
        for phrase in condition_warning_phrases
    )

    is_verified = (
        exact_price
        and not ambiguous_quantity
        and not has_condition_warning
    )
    row = {
        "product_id": product_id,
        "marketplace": "ebay",
        "external_listing_id": external_sale_id,
        "title": sale["title"],
        "sale_price": sale["sale_price"],
        "shipping_price": sale["shipping_price"],
        "total_price": sale["total_price"],
        "currency": sale["currency"],
        "sale_type": sale["sale_type"],
        "sold_at": _normalize_sold_at(
            sale["sold_at"]
        ),
        "listing_url": sale["listing_url"],
        "image_url": sale["image_url"],
        "quantity": 1,
        "is_verified": is_verified,
        "best_offer_accepted": (
            sale["best_offer_accepted"]
        ),
        "price_is_exact": exact_price,
        "seller_name": sale["seller_name"],
        "seller_feedback": (
            sale["seller_feedback"]
        ),
        "seller_feedback_score": (
            sale["seller_feedback_score"]
        ),
        "data_source": "soldcomps",
    }

    return {
        key: _serialize_value(value)
        for key, value in row.items()
    }


def upsert_soldcomps_sales(
    *,
    product_id: int,
    sales: list[dict[str, Any]],
) -> int:
    if not sales:
        return 0

    rows = [
        prepare_soldcomps_sale_row(
            product_id=product_id,
            sale=sale,
        )
        for sale in sales
    ]

    supabase = get_supabase_client()

    response = (
        supabase
        .table("market_sales")
        .upsert(
            rows,
            on_conflict=(
                "marketplace,"
                "external_listing_id"
            ),
        )
        .execute()
    )

    if response.data is None:
        raise RuntimeError(
            "Supabase SoldComps upsert "
            "returned no data."
        )

    return len(rows)