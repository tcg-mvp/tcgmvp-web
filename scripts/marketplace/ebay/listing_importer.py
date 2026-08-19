from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def _serialize_value(
    value: Any,
) -> Any:
    """
    Convert Python values into JSON-safe values
    for the Supabase client.
    """
    if isinstance(value, Decimal):
        return str(value)

    return value


def _prepare_listing_row(
    *,
    product_id: int,
    listing: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert one normalized eBay listing into the
    public.market_listings database shape.
    """
    external_listing_id = listing.get(
        "external_listing_id"
    )

    if not external_listing_id:
        raise ValueError(
            "Cannot import eBay listing without "
            "external_listing_id."
        )

    now_utc = datetime.now(
        timezone.utc
    ).isoformat()

    row = {
        "product_id": product_id,
        "marketplace": "ebay",
        "external_listing_id": (
            external_listing_id
        ),
        "title": listing["title"],
        "listing_price": (
            listing["listing_price"]
        ),
        "shipping_price": (
            listing["shipping_price"]
        ),
        "total_price": (
            listing["total_price"]
        ),
        "currency": listing["currency"],
        "listing_type": (
            listing["listing_type"]
        ),
        "seller_name": (
            listing["seller_name"]
        ),
        "seller_feedback": (
            listing["seller_feedback"]
        ),
        "listing_url": (
            listing["listing_url"]
        ),
        "image_url": (
            listing["image_url"]
        ),
        "quantity": listing["quantity"],
        "listed_at": (
            listing["listed_at"]
        ),
        "last_seen": (
            listing.get("last_seen")
            or now_utc
        ),
    }

    return {
        key: _serialize_value(value)
        for key, value in row.items()
    }


def upsert_ebay_listings(
    *,
    product_id: int,
    listings: list[dict[str, Any]],
) -> int:
    """
    Upsert normalized eBay active listings into
    public.market_listings.

    Identity:
        marketplace + external_listing_id

    Existing listings are updated rather than
    duplicated.
    """
    if not listings:
        return 0

    rows = [
        _prepare_listing_row(
            product_id=product_id,
            listing=listing,
        )
        for listing in listings
    ]

    supabase = get_supabase_client()

    response = (
        supabase
        .table("market_listings")
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
            "Supabase eBay listing upsert "
            "returned no data."
        )

    return len(rows)