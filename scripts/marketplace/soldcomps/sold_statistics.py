from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal, InvalidOperation
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

    try:
        return Decimal(
            str(value)
        )

    except (
        InvalidOperation,
        TypeError,
        ValueError,
    ):
        return None


def calculate_verified_sold_statistics(
    *,
    product_id: int,
    window_days: int = 30,
) -> dict[str, Any]:
    """
    Calculate rolling sold-market statistics using
    verified eBay SoldComps transactions only.

    Important:
    - Only is_verified = true sales are included.
    - Best Offer / ambiguous sales therefore do not
      influence these statistics.
    - All verified exact-price sales are retained.
    - Median sale price provides the primary robust
      measure of central market value.
    - Raw evidence remains preserved in market_sales.
    - sale_price is used for sale-price statistics.
    - The window is rolling, not calendar-month based.
    """
    if window_days < 1:
        raise ValueError(
            "window_days must be at least 1."
        )

    cutoff = (
        datetime.now(UTC)
        - timedelta(
            days=window_days
        )
    ).isoformat()

    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "market_sales"
        )
        .select(
            "sale_price,"
            "quantity,"
            "sold_at,"
            "is_verified"
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
            "data_source",
            "soldcomps",
        )
        .eq(
            "is_verified",
            True,
        )
        .gte(
            "sold_at",
            cutoff,
        )
        .order(
            "sold_at",
            desc=False,
        )
        .execute()
    )

    rows = (
        response.data
        or []
    )

    sale_prices: list[
        Decimal
    ] = []

    sales_volume = 0

    for row in rows:
        sale_price = _to_decimal(
            row.get(
                "sale_price"
            )
        )

        if (
            sale_price is None
            or sale_price <= 0
        ):
            continue

        sale_prices.append(
            sale_price
        )

        quantity = row.get(
            "quantity"
        )

        if quantity is None:
            quantity = 1

        try:
            normalized_quantity = int(
                quantity
            )

        except (
            TypeError,
            ValueError,
        ):
            normalized_quantity = 1

        if normalized_quantity < 1:
            normalized_quantity = 1

        sales_volume += (
            normalized_quantity
        )

    if not sale_prices:
        return {
            "product_id":
                product_id,

            "window_days":
                window_days,

            "sales_count":
                0,

            "sales_volume":
                0,

            "average_sale_price":
                None,

            "median_sale_price":
                None,

            "low_sale_price":
                None,

            "high_sale_price":
                None,
        }

    average_sale_price = (
        sum(
            sale_prices,
            Decimal("0"),
        )
        / Decimal(
            len(
                sale_prices
            )
        )
    )

    return {
        "product_id":
            product_id,

        "window_days":
            window_days,

        "sales_count":
            len(
                sale_prices
            ),

        "sales_volume":
            sales_volume,

        "average_sale_price":
            average_sale_price,

        "median_sale_price":
            median(
                sale_prices
            ),

        "low_sale_price":
            min(
                sale_prices
            ),

        "high_sale_price":
            max(
                sale_prices
            ),
    }