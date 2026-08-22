from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


EBAY_MARKETPLACE_ID = 1


def _today() -> str:
    return (
        datetime.now(UTC)
        .date()
        .isoformat()
    )


def _serialize_decimal(
    value: Decimal | None,
) -> str | None:
    if value is None:
        return None

    return str(value)


def _save_partial_daily_metric(
    *,
    product_id: int,
    marketplace_id: int,
    metric_date: str,
    fields: dict[str, Any],
) -> dict:
    """
    Update only the supplied fields when today's
    daily metric already exists.

    If no row exists yet, create it.

    This prevents one metric writer from nulling
    fields written by another metric writer.
    """
    supabase = get_supabase_client()

    existing_response = (
        supabase
        .table("daily_market_metrics")
        .select("id")
        .eq("product_id", product_id)
        .eq(
            "marketplace_id",
            marketplace_id,
        )
        .eq(
            "metric_date",
            metric_date,
        )
        .limit(1)
        .execute()
    )

    existing_rows = (
        existing_response.data
        or []
    )

    if existing_rows:
        row_id = int(
            existing_rows[0]["id"]
        )

        response = (
            supabase
            .table("daily_market_metrics")
            .update(fields)
            .eq("id", row_id)
            .execute()
        )

    else:
        record = {
            "product_id":
                product_id,

            "marketplace_id":
                marketplace_id,

            "metric_date":
                metric_date,

            **fields,
        }

        response = (
            supabase
            .table("daily_market_metrics")
            .insert(record)
            .execute()
        )

    if not response.data:
        raise RuntimeError(
            "Supabase did not return the "
            "saved daily market metric."
        )

    return response.data[0]


def save_market_price(
    *,
    product_id: int,
    marketplace_id: int,
    market_price: Decimal,
) -> dict:
    """
    Save today's current market price without
    overwriting other fields on the same daily row.
    """
    return _save_partial_daily_metric(
        product_id=product_id,
        marketplace_id=marketplace_id,
        metric_date=_today(),
        fields={
            "market_price":
                str(market_price),
        },
    )


def save_historical_market_price(
    *,
    product_id: int,
    marketplace_id: int,
    metric_date: str,
    market_price: Decimal,
) -> dict:
    """
    Save one historical market-price observation
    without overwriting unrelated daily metrics.
    """
    return _save_partial_daily_metric(
        product_id=product_id,
        marketplace_id=marketplace_id,
        metric_date=metric_date,
        fields={
            "market_price":
                str(market_price),
        },
    )


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
    Save active eBay listing statistics into
    today's eBay daily metric.

    Only active-listing fields are updated.
    Existing sold-market fields are preserved.
    """
    return _save_partial_daily_metric(
        product_id=product_id,
        marketplace_id=(
            EBAY_MARKETPLACE_ID
        ),
        metric_date=_today(),
        fields={
            "active_listing_count":
                active_listing_count,

            "lowest_listing_price":
                _serialize_decimal(
                    lowest_listing_price
                ),

            "unique_seller_count":
                unique_seller_count,

            "known_shipping_count":
                known_shipping_count,

            "unknown_shipping_count":
                unknown_shipping_count,

            "best_offer_count":
                best_offer_count,

            "median_listing_price":
                _serialize_decimal(
                    median_listing_price
                ),

            "highest_listing_price":
                _serialize_decimal(
                    highest_listing_price
                ),

            "delivered_price_sample_size":
                delivered_price_sample_size,

            "lowest_delivered_price":
                _serialize_decimal(
                    lowest_delivered_price
                ),

            "median_delivered_price":
                _serialize_decimal(
                    median_delivered_price
                ),

            "highest_delivered_price":
                _serialize_decimal(
                    highest_delivered_price
                ),
        },
    )


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
    today's eBay daily metric.

    Only sold-market fields are updated.
    Existing active-listing fields are preserved.
    """
    return _save_partial_daily_metric(
        product_id=product_id,
        marketplace_id=(
            EBAY_MARKETPLACE_ID
        ),
        metric_date=_today(),
        fields={
            "average_sale_price":
                _serialize_decimal(
                    average_sale_price
                ),

            "median_sale_price":
                _serialize_decimal(
                    median_sale_price
                ),

            "low_sale_price":
                _serialize_decimal(
                    low_sale_price
                ),

            "high_sale_price":
                _serialize_decimal(
                    high_sale_price
                ),

            "sales_count":
                sales_count,

            "sales_volume":
                sales_volume,
        },
    )