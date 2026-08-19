from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from scripts.marketplace.supabase_client import get_supabase_client


EBAY_MARKETPLACE_ID = 1
TCGPLAYER_MARKETPLACE_ID = 2

EBAY_LISTING_MAX_AGE_DAYS = 2


def _percent_change(
    current_price: Decimal | None,
    previous_price: Decimal | None,
) -> Decimal | None:
    if (
        current_price is None
        or previous_price is None
        or previous_price == 0
    ):
        return None

    return (
        (
            (current_price - previous_price)
            / previous_price
            * Decimal("100")
        ).quantize(Decimal("0.01"))
    )


def _get_price_on_or_before(
    rows: list[dict],
    target_date: date,
) -> Decimal | None:
    eligible = [
        row
        for row in rows
        if row["metric_date"] <= target_date.isoformat()
        and row.get("market_price") is not None
    ]

    if not eligible:
        return None

    latest = max(
        eligible,
        key=lambda row: row["metric_date"],
    )

    return Decimal(str(latest["market_price"]))


def _one_year_before(target_date: date) -> date:
    try:
        return target_date.replace(
            year=target_date.year - 1
        )
    except ValueError:
        # Handles February 29 in leap years.
        return target_date.replace(
            year=target_date.year - 1,
            day=28,
        )


def _get_latest_ebay_listing_summary(
    *,
    product_id: int,
) -> dict:
    """
    Return the latest fresh eBay listing evidence
    for one product.

    Stale eBay snapshots are not presented as
    current active-listing evidence.
    """
    supabase = get_supabase_client()

    response = (
        supabase.table("daily_market_metrics")
        .select(
            "metric_date,"
            "active_listing_count,"
            "lowest_listing_price"
        )
        .eq("product_id", product_id)
        .eq("marketplace_id", EBAY_MARKETPLACE_ID)
        .order("metric_date", desc=True)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        return {
            "active_listings": None,
            "lowest_listing_price": None,
        }

    latest = rows[0]

    metric_date = datetime.fromisoformat(
        latest["metric_date"]
    ).date()

    cutoff_date = (
        datetime.now(UTC).date()
        - timedelta(days=EBAY_LISTING_MAX_AGE_DAYS)
    )

    if metric_date < cutoff_date:
        return {
            "active_listings": None,
            "lowest_listing_price": None,
        }

    active_listings = latest.get(
        "active_listing_count"
    )

    lowest_listing_price = latest.get(
        "lowest_listing_price"
    )

    return {
        "active_listings": (
            int(active_listings)
            if active_listings is not None
            else None
        ),
        "lowest_listing_price": (
            Decimal(str(lowest_listing_price))
            if lowest_listing_price is not None
            else None
        ),
    }


def calculate_product_market_summary(
    *,
    product_id: int,
) -> dict:
    supabase = get_supabase_client()

    response = (
        supabase.table("daily_market_metrics")
        .select("metric_date,market_price")
        .eq("product_id", product_id)
        .eq(
            "marketplace_id",
            TCGPLAYER_MARKETPLACE_ID,
        )
        .order("metric_date", desc=False)
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise LookupError(
            f"No daily market metrics found for product_id={product_id}."
        )

    priced_rows = [
        row
        for row in rows
        if row.get("market_price") is not None
    ]

    if not priced_rows:
        raise LookupError(
            f"No market prices found for product_id={product_id}."
        )

    latest_row = priced_rows[-1]

    latest_date = datetime.fromisoformat(
        latest_row["metric_date"]
    ).date()

    current_price = Decimal(
        str(latest_row["market_price"])
    )

    price_7d = _get_price_on_or_before(
        priced_rows,
        latest_date - timedelta(days=7),
    )

    price_30d = _get_price_on_or_before(
        priced_rows,
        latest_date - timedelta(days=30),
    )

    price_90d = _get_price_on_or_before(
        priced_rows,
        latest_date - timedelta(days=90),
    )

    price_1y = _get_price_on_or_before(
        priced_rows,
        _one_year_before(latest_date),
    )

    ebay_summary = (
        _get_latest_ebay_listing_summary(
            product_id=product_id,
        )
    )

    return {
        "product_id": product_id,
        "current_market_price": current_price,
        "previous_market_price": price_30d,
        "change_7d_percent": _percent_change(
            current_price,
            price_7d,
        ),
        "change_30d_percent": _percent_change(
            current_price,
            price_30d,
        ),
        "change_90d_percent": _percent_change(
            current_price,
            price_90d,
        ),
        "change_1y_percent": _percent_change(
            current_price,
            price_1y,
        ),
        "active_listings": (
            ebay_summary["active_listings"]
        ),
        "lowest_listing_price": (
            ebay_summary["lowest_listing_price"]
        ),
        "calculated_at": datetime.now(
            UTC
        ).isoformat(),
    }


def update_calculated_market_summary(
    *,
    product_id: int,
) -> dict:
    supabase = get_supabase_client()

    summary = calculate_product_market_summary(
        product_id=product_id,
    )

    record = {
        "product_id": summary["product_id"],
        "current_market_price": str(
            summary["current_market_price"]
        ),
        "previous_market_price": (
            str(summary["previous_market_price"])
            if summary["previous_market_price"] is not None
            else None
        ),
        "change_7d_percent": (
            str(summary["change_7d_percent"])
            if summary["change_7d_percent"] is not None
            else None
        ),
        "change_30d_percent": (
            str(summary["change_30d_percent"])
            if summary["change_30d_percent"] is not None
            else None
        ),
        "change_90d_percent": (
            str(summary["change_90d_percent"])
            if summary["change_90d_percent"] is not None
            else None
        ),
        "change_1y_percent": (
            str(summary["change_1y_percent"])
            if summary["change_1y_percent"] is not None
            else None
        ),
        "active_listings": (
            summary["active_listings"]
        ),
        "lowest_listing_price": (
            str(summary["lowest_listing_price"])
            if summary["lowest_listing_price"] is not None
            else None
        ),
        "calculated_at": summary["calculated_at"],
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
            "Supabase did not return the updated market summary."
        )

    return response.data[0]