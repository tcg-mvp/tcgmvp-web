from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

import requests

from scripts.marketplace.ebay.api import (
    get_application_token,
)
from scripts.marketplace.ebay.listing_filter import (
    is_valid_booster_box_listing,
)


EBAY_BROWSE_URL = (
    "https://api.ebay.com/buy/browse/v1/item_summary/search"
)


def fetch_active_booster_box_listings(
    *,
    query: str,
    product_keywords: tuple[str, ...],
    limit: int = 50,
) -> list[dict]:
    token = get_application_token()

    response = requests.get(
        EBAY_BROWSE_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        params={
            "q": query,
            "limit": str(limit),
        },
        timeout=30,
    )

    if not response.ok:
        raise RuntimeError(
            "eBay Browse API request failed.\n"
            f"Status: {response.status_code}\n"
            f"Response: {response.text}"
        )

    payload = response.json()
    items = payload.get("itemSummaries", [])

    observed_at = datetime.now(UTC).isoformat()

    listings: list[dict] = []

    for item in items:
        title = item.get("title", "")
        condition = item.get("condition")

        if not is_valid_booster_box_listing(
            title=title,
            condition=condition,
            product_keywords=product_keywords,
        ):
            continue

        buying_options = item.get("buyingOptions") or []

        # Treat only fixed-price listings as comparable asks.
        if "FIXED_PRICE" not in buying_options:
            continue

        price_data = item.get("price") or {}
        listing_price_raw = price_data.get("value")

        if listing_price_raw is None:
            continue

        listing_price = Decimal(
            str(listing_price_raw)
        )

        shipping_options = item.get("shippingOptions") or []

        shipping_price: Decimal | None = None

        if shipping_options:
            shipping_cost_data = (
                shipping_options[0].get("shippingCost")
                or {}
            )

            shipping_value = shipping_cost_data.get("value")

            if shipping_value is not None:
                shipping_price = Decimal(
                    str(shipping_value)
                )

        seller = item.get("seller") or {}
        image = item.get("image") or {}

        total_price = (
            listing_price + shipping_price
            if shipping_price is not None
            else None
        )

        listings.append(
            {
                "external_listing_id": item.get("itemId"),
                "title": title,
                "listing_price": listing_price,
                "shipping_price": shipping_price,
                "total_price": total_price,
                "currency": price_data.get("currency") or "USD",
                "listing_type": ",".join(buying_options),
                "seller_name": seller.get("username"),
                "seller_feedback": seller.get(
                    "feedbackPercentage"
                ),
                "listing_url": item.get("itemWebUrl"),
                "image_url": image.get("imageUrl"),
                "quantity": 1,
                "listed_at": None,
                "last_seen": observed_at,
            }
        )

    return listings