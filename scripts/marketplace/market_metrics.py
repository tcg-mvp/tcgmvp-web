from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def save_market_price(
    *,
    product_id: int,
    marketplace_id: int,
    market_price: Decimal,
) -> dict:
    supabase = get_supabase_client()

    metric_date = (
        datetime.now(UTC)
        .date()
        .isoformat()
    )

    record = {
        "product_id": product_id,
        "marketplace_id": marketplace_id,
        "metric_date": metric_date,
        "market_price": str(
            market_price
        ),
        "sales_count": 0,
        "sales_volume": 0,
    }

    response = (
        supabase
        .table("daily_market_metrics")
        .upsert(
            record,
            on_conflict=(
                "product_id,"
                "marketplace_id,"
                "metric_date"
            ),
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the saved "
            "market metric."
        )

    return response.data[0]


def save_historical_market_price(
    *,
    product_id: int,
    marketplace_id: int,
    metric_date: str,
    market_price: Decimal,
) -> dict:
    supabase = get_supabase_client()

    record = {
        "product_id": product_id,
        "marketplace_id": marketplace_id,
        "metric_date": metric_date,
        "market_price": str(
            market_price
        ),
        "sales_count": 0,
        "sales_volume": 0,
    }

    response = (
        supabase
        .table("daily_market_metrics")
        .upsert(
            record,
            on_conflict=(
                "product_id,"
                "marketplace_id,"
                "metric_date"
            ),
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the saved "
            "historical market metric."
        )

    return response.data[0]


def save_ebay_listing_metrics(
    *,
    product_id: int,
    active_listing_count: int,
    unique_seller_count: int,
    known_shipping_count: int,
    unknown_shipping_count: int,
    best_offer_count: int,
    lowest_listing_price: Decimal | None,
    median_listing_price: Decimal | None,
    highest_listing_price: Decimal | None,
    delivered_price_sample_size: int,
    lowest_delivered_price: Decimal | None,
    median_delivered_price: Decimal | None,
    highest_delivered_price: Decimal | None,
) -> dict:
    """
    Save active eBay listing statistics into today's
    eBay daily_market_metrics row.

    This updates only active-listing fields and leaves
    sold-market fields untouched.
    """
    supabase = get_supabase_client()

    metric_date = (
        datetime.now(UTC)
        .date()
        .isoformat()
    )

    def serialize_decimal(
        value: Decimal | None,
    ) -> str | None:
        if value is None:
            return None

        return str(value)

    record = {
        "product_id": product_id,
        "marketplace_id": 1,
        "metric_date": metric_date,

        "active_listing_count": (
            active_listing_count
        ),
        "lowest_listing_price": (
            serialize_decimal(
                lowest_listing_price
            )
        ),
        "unique_seller_count": (
            unique_seller_count
        ),
        "known_shipping_count": (
            known_shipping_count
        ),
        "unknown_shipping_count": (
            unknown_shipping_count
        ),
        "best_offer_count": (
            best_offer_count
        ),
        "median_listing_price": (
            serialize_decimal(
                median_listing_price
            )
        ),
        "highest_listing_price": (
            serialize_decimal(
                highest_listing_price
            )
        ),
        "delivered_price_sample_size": (
            delivered_price_sample_size
        ),
        "lowest_delivered_price": (
            serialize_decimal(
                lowest_delivered_price
            )
        ),
        "median_delivered_price": (
            serialize_decimal(
                median_delivered_price
            )
        ),
        "highest_delivered_price": (
            serialize_decimal(
                highest_delivered_price
            )
        ),
    }

    response = (
        supabase
        .table("daily_market_metrics")
        .upsert(
            record,
            on_conflict=(
                "product_id,"
                "marketplace_id,"
                "metric_date"
            ),
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the saved "
            "eBay listing metric."
        )

    return response.data[0]


def save_ebay_sold_metrics(
    *,
    product_id: int,
    sales_count: int,
    sales_volume: int,
    average_sale_price: Decimal | None,
    median_sale_price: Decimal | None,
    low_sale_price: Decimal | None,
    high_sale_price: Decimal | None,
) -> dict:
    """
    Save rolling verified eBay sold statistics into
    today's eBay daily_market_metrics row.

    This updates only sold-market fields and leaves
    active-listing fields untouched.
    """
    supabase = get_supabase_client()

    metric_date = (
        datetime.now(UTC)
        .date()
        .isoformat()
    )

    def serialize_decimal(
        value: Decimal | None,
    ) -> str | None:
        if value is None:
            return None

        return str(value)

    record = {
        "product_id": product_id,
        "marketplace_id": 1,
        "metric_date": metric_date,

        "average_sale_price": (
            serialize_decimal(
                average_sale_price
            )
        ),
        "median_sale_price": (
            serialize_decimal(
                median_sale_price
            )
        ),
        "low_sale_price": (
            serialize_decimal(
                low_sale_price
            )
        ),
        "high_sale_price": (
            serialize_decimal(
                high_sale_price
            )
        ),
        "sales_count": sales_count,
        "sales_volume": sales_volume,
    }

    response = (
        supabase
        .table("daily_market_metrics")
        .upsert(
            record,
            on_conflict=(
                "product_id,"
                "marketplace_id,"
                "metric_date"
            ),
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the saved "
            "eBay sold metric."
        )

    return response.data[0]