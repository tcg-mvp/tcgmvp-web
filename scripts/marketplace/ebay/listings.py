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


# Broad protection when TCGCSV is the only
# available pricing anchor.
MIN_REFERENCE_PRICE_RATIO = Decimal("0.50")
MAX_REFERENCE_PRICE_RATIO = Decimal("2.00")


# When verified sold evidence exists, we can use
# a stronger floor because we have two independent
# market anchors.
MIN_CONFIRMED_MARKET_RATIO = Decimal("0.65")
MAX_CONFIRMED_MARKET_RATIO = Decimal("1.75")


def _get_market_anchor(
    *,
    reference_price: Decimal | None,
    verified_median_sale_price: Decimal | None,
) -> Decimal | None:
    """
    Build the best available market anchor.

    TCGCSV alone:
        use TCGCSV reference price.

    TCGCSV + verified SoldComps median:
        use the midpoint of both evidence sources.

    This avoids allowing one source alone to dictate
    the entire active-listing sanity range.
    """
    valid_reference = (
        reference_price is not None
        and reference_price > 0
    )

    valid_sold_median = (
        verified_median_sale_price is not None
        and verified_median_sale_price > 0
    )

    if (
        valid_reference
        and valid_sold_median
    ):
        return (
            reference_price
            + verified_median_sale_price
        ) / Decimal("2")

    if valid_reference:
        return reference_price

    if valid_sold_median:
        return verified_median_sale_price

    return None


def _is_price_plausible(
    *,
    listing_price: Decimal,
    reference_price: Decimal | None,
    verified_median_sale_price: Decimal | None,
) -> bool:
    """
    Determine whether an active listing is credible
    enough to participate in TCGMVP market statistics.

    This is intentionally conservative:
    - broad range with TCGCSV only
    - stronger range when verified sold evidence exists
    """
    market_anchor = _get_market_anchor(
        reference_price=reference_price,
        verified_median_sale_price=(
            verified_median_sale_price
        ),
    )

    if market_anchor is None:
        return True

    has_confirmed_sold_evidence = (
        reference_price is not None
        and reference_price > 0
        and verified_median_sale_price is not None
        and verified_median_sale_price > 0
    )

    if has_confirmed_sold_evidence:
        minimum_price = (
            market_anchor
            * MIN_CONFIRMED_MARKET_RATIO
        )

        maximum_price = (
            market_anchor
            * MAX_CONFIRMED_MARKET_RATIO
        )

    else:
        minimum_price = (
            market_anchor
            * MIN_REFERENCE_PRICE_RATIO
        )

        maximum_price = (
            market_anchor
            * MAX_REFERENCE_PRICE_RATIO
        )

    return (
        minimum_price
        <= listing_price
        <= maximum_price
    )


def fetch_active_booster_box_listings(
    *,
    query: str,
    product_keywords: tuple[str, ...],
    limit: int = 50,
    reference_price: Decimal | None = None,
    verified_median_sale_price: Decimal | None = None,
) -> list[dict]:
    token = get_application_token()

    response = requests.get(
        EBAY_BROWSE_URL,
        headers={
            "Authorization": (
                f"Bearer {token}"
            ),
            "X-EBAY-C-MARKETPLACE-ID": (
                "EBAY_US"
            ),
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
            f"Status: "
            f"{response.status_code}\n"
            f"Response: "
            f"{response.text}"
        )

    payload = response.json()

    items = (
        payload.get(
            "itemSummaries"
        )
        or []
    )

    observed_at = (
        datetime.now(UTC)
        .isoformat()
    )

    listings: list[dict] = []

    title_valid_count = 0
    price_sanity_exclusions = 0

    for item in items:
        title = (
            item.get("title")
            or ""
        )

        condition = item.get(
            "condition"
        )

        if not is_valid_booster_box_listing(
            title=title,
            condition=condition,
            product_keywords=product_keywords,
        ):
            continue

        buying_options = (
            item.get(
                "buyingOptions"
            )
            or []
        )

        # Only fixed-price listings represent
        # comparable current asking prices.
        if (
            "FIXED_PRICE"
            not in buying_options
        ):
            continue

        price_data = (
            item.get("price")
            or {}
        )

        listing_price_raw = (
            price_data.get(
                "value"
            )
        )

        if listing_price_raw is None:
            continue

        listing_price = Decimal(
            str(
                listing_price_raw
            )
        )

        if listing_price <= 0:
            continue

        title_valid_count += 1

        if not _is_price_plausible(
            listing_price=listing_price,
            reference_price=reference_price,
            verified_median_sale_price=(
                verified_median_sale_price
            ),
        ):
            price_sanity_exclusions += 1

            print(
                "  Excluding suspicious "
                "listing price: "
                f"${listing_price} | "
                f"{title}"
            )

            continue

        shipping_options = (
            item.get(
                "shippingOptions"
            )
            or []
        )

        shipping_price: (
            Decimal | None
        ) = None

        if shipping_options:
            shipping_cost_data = (
                shipping_options[0]
                .get(
                    "shippingCost"
                )
                or {}
            )

            shipping_value = (
                shipping_cost_data.get(
                    "value"
                )
            )

            if shipping_value is not None:
                shipping_price = Decimal(
                    str(
                        shipping_value
                    )
                )

        seller = (
            item.get("seller")
            or {}
        )

        image = (
            item.get("image")
            or {}
        )

        total_price = (
            listing_price
            + shipping_price
            if shipping_price is not None
            else None
        )

        listings.append(
            {
                "external_listing_id":
                    item.get(
                        "itemId"
                    ),

                "title":
                    title,

                "listing_price":
                    listing_price,

                "shipping_price":
                    shipping_price,

                "total_price":
                    total_price,

                "currency":
                    (
                        price_data.get(
                            "currency"
                        )
                        or "USD"
                    ),

                "listing_type":
                    ",".join(
                        buying_options
                    ),

                "seller_name":
                    seller.get(
                        "username"
                    ),

                "seller_feedback":
                    seller.get(
                        "feedbackPercentage"
                    ),

                "listing_url":
                    item.get(
                        "itemWebUrl"
                    ),

                "image_url":
                    image.get(
                        "imageUrl"
                    ),

                "quantity":
                    1,

                "listed_at":
                    None,

                "last_seen":
                    observed_at,
            }
        )

    print(
        "Title-valid listings: "
        f"{title_valid_count}"
    )

    print(
        "Price-sanity exclusions: "
        f"{price_sanity_exclusions}"
    )

    return listings