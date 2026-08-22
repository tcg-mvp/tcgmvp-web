from __future__ import annotations

from decimal import Decimal
from statistics import median
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def _to_decimal(
    value: Any,
) -> Decimal | None:
    if value is None:
        return None

    return Decimal(
        str(value)
    )


def calculate_ebay_listing_statistics(
    *,
    product_id: int,
    freshness_hours: int = 24,
) -> dict[str, Any]:
    """
    Calculate active eBay asking-price statistics
    for one TCGMVP product.

    Important:
    - Statistics use only listings from the latest
      successful collection snapshot.
    - Older listings remain stored in market_listings
      as historical/raw evidence.
    - This prevents listings accepted under older
      filtering rules from affecting today's metrics.
    - freshness_hours remains in the signature for
      backward compatibility but is not used to build
      the snapshot.
    """
    if freshness_hours < 1:
        raise ValueError(
            "freshness_hours must be at least 1."
        )

    supabase = (
        get_supabase_client()
    )

    latest_response = (
        supabase
        .table("market_listings")
        .select("last_seen")
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace",
            "ebay",
        )
        .order(
            "last_seen",
            desc=True,
        )
        .limit(1)
        .execute()
    )

    latest_rows = (
        latest_response.data
        or []
    )

    if not latest_rows:
        return {
            "product_id":
                product_id,

            "freshness_hours":
                freshness_hours,

            "active_listing_count":
                0,

            "unique_seller_count":
                0,

            "known_shipping_count":
                0,

            "unknown_shipping_count":
                0,

            "best_offer_count":
                0,

            "min_listing_price":
                None,

            "median_listing_price":
                None,

            "max_listing_price":
                None,

            "delivered_price_sample_size":
                0,

            "min_delivered_price":
                None,

            "median_delivered_price":
                None,

            "max_delivered_price":
                None,
        }

    latest_seen = (
        latest_rows[0][
            "last_seen"
        ]
    )

    response = (
        supabase
        .table("market_listings")
        .select(
            "external_listing_id,"
            "listing_price,"
            "shipping_price,"
            "total_price,"
            "listing_type,"
            "seller_name,"
            "last_seen"
        )
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace",
            "ebay",
        )
        .eq(
            "last_seen",
            latest_seen,
        )
        .execute()
    )

    rows = (
        response.data
        or []
    )

    listing_prices: list[
        Decimal
    ] = []

    delivered_prices: list[
        Decimal
    ] = []

    known_shipping_count = 0
    unknown_shipping_count = 0
    best_offer_count = 0

    sellers: set[
        str
    ] = set()

    for row in rows:
        listing_price = (
            _to_decimal(
                row.get(
                    "listing_price"
                )
            )
        )

        if (
            listing_price
            is not None
        ):
            listing_prices.append(
                listing_price
            )

        shipping_price = (
            _to_decimal(
                row.get(
                    "shipping_price"
                )
            )
        )

        if shipping_price is None:
            unknown_shipping_count += 1
        else:
            known_shipping_count += 1

        total_price = (
            _to_decimal(
                row.get(
                    "total_price"
                )
            )
        )

        if total_price is not None:
            delivered_prices.append(
                total_price
            )

        listing_type = (
            row.get(
                "listing_type"
            )
            or ""
        )

        if (
            "BEST_OFFER"
            in listing_type
        ):
            best_offer_count += 1

        seller_name = (
            row.get(
                "seller_name"
            )
        )

        if seller_name:
            sellers.add(
                seller_name
            )

    return {
        "product_id":
            product_id,

        "freshness_hours":
            freshness_hours,

        "snapshot_last_seen":
            latest_seen,

        "active_listing_count":
            len(rows),

        "unique_seller_count":
            len(sellers),

        "known_shipping_count":
            known_shipping_count,

        "unknown_shipping_count":
            unknown_shipping_count,

        "best_offer_count":
            best_offer_count,

        "min_listing_price":
            (
                min(
                    listing_prices
                )
                if listing_prices
                else None
            ),

        "median_listing_price":
            (
                median(
                    listing_prices
                )
                if listing_prices
                else None
            ),

        "max_listing_price":
            (
                max(
                    listing_prices
                )
                if listing_prices
                else None
            ),

        "delivered_price_sample_size":
            len(
                delivered_prices
            ),

        "min_delivered_price":
            (
                min(
                    delivered_prices
                )
                if delivered_prices
                else None
            ),

        "median_delivered_price":
            (
                median(
                    delivered_prices
                )
                if delivered_prices
                else None
            ),

        "max_delivered_price":
            (
                max(
                    delivered_prices
                )
                if delivered_prices
                else None
            ),
    }