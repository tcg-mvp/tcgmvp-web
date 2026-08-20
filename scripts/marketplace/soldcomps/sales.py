from __future__ import annotations

from datetime import (
    UTC,
    datetime,
    timedelta,
)
from decimal import (
    Decimal,
    InvalidOperation,
)
from typing import Any

from scripts.marketplace.ebay.listing_filter import (
    is_valid_booster_box_listing,
)
from scripts.marketplace.soldcomps.api import (
    search_all_sold_listings,
)


MIN_REFERENCE_PRICE_RATIO = Decimal("0.50")
MAX_REFERENCE_PRICE_RATIO = Decimal("2.00")


SOLD_EXCLUDED_TITLE_PHRASES = (
    "odds",
    "chance to win",
    "chance of winning",
    "raffle",
    "mystery",
)


SOLD_BUNDLE_EXCLUSION_PHRASES = (
    "build & battle display",
    "build and battle display",
    "build & battle box",
    "build and battle box",
    "elite trainer box",
    "booster bundle",
    "collection box",
    "ultra premium collection",
    "ultra-premium collection",
    "premium collection",
    "collector chest",
    "blister pack",
    "blister packs",
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


def _is_disallowed_bundle(
    title: str,
) -> bool:
    """
    Reject listings where the booster box is bundled
    with another Pokémon sealed product.

    Acrylic cases, plastic cases, protectors, and other
    storage accessories are intentionally allowed.
    """
    normalized_title = (
        title.lower()
        .replace("pokémon", "pokemon")
        .strip()
    )

    if any(
        phrase in normalized_title
        for phrase in SOLD_BUNDLE_EXCLUSION_PHRASES
    ):
        return True

    padded_title = (
        f" {normalized_title} "
    )

    abbreviated_bundle_phrases = (
        " + etb ",
        " + upc ",
        " w/ etb ",
        " w/ upc ",
        " with etb ",
        " with upc ",
    )

    if any(
        phrase in padded_title
        for phrase in abbreviated_bundle_phrases
    ):
        return True

    return False


def fetch_sold_booster_box_sales(
    *,
    query: str,
    product_keywords: tuple[str, ...],
    reference_price: Decimal,
    count: int = 50,
    page: int = 1,
) -> list[dict[str, Any]]:
    """
    Fetch and normalize recent SoldComps
    completed eBay sales.

    Collection strategy:
    - Search a rolling 30-day period.
    - Request up to 200 raw results per page.
    - Fetch up to 5 pages.
    - Deduplicate by eBay item ID.
    - Apply TCGMVP booster-box matching rules.
    - Reject bundles with other sealed products.
    - Apply broad reference-price sanity rules.
    - Preserve Best Offer uncertainty.
    - Preserve unknown shipping as None.

    count and page remain in the signature for
    compatibility with existing test/collector calls.
    Multi-page retrieval is controlled internally.
    """
    del count
    del page

    if reference_price <= 0:
        raise ValueError(
            "reference_price must be greater than 0."
        )

    sold_after = (
        datetime.now(UTC)
        - timedelta(days=30)
    ).date().isoformat()

    payload = search_all_sold_listings(
        keyword=query,
        ebay_site="ebay.com",
        count_per_page=200,
        max_pages=5,
        sold_after=sold_after,
    )

    raw_items = (
        payload.get("items")
        or []
    )

    normalized_sales: list[
        dict[str, Any]
    ] = []

    minimum_plausible_price = (
        reference_price
        * MIN_REFERENCE_PRICE_RATIO
    )

    maximum_plausible_price = (
        reference_price
        * MAX_REFERENCE_PRICE_RATIO
    )

    for item in raw_items:
        title = (
            item.get("title")
            or ""
        )

        condition = item.get(
            "condition"
        )

        normalized_title = (
            title.lower().strip()
        )

        if any(
            phrase in normalized_title
            for phrase in SOLD_EXCLUDED_TITLE_PHRASES
        ):
            continue

        if _is_disallowed_bundle(
            title
        ):
            continue

        if not is_valid_booster_box_listing(
            title=title,
            condition=condition,
            product_keywords=product_keywords,
        ):
            continue

        if (
            item.get("listingType")
            != "sold"
        ):
            continue

        sold_price = _to_decimal(
            item.get("soldPrice")
        )

        if sold_price is None:
            continue

        if (
            sold_price
            < minimum_plausible_price
            or sold_price
            > maximum_plausible_price
        ):
            continue

        currency = item.get(
            "soldCurrency"
        )

        if not currency:
            continue

        shipping_price = _to_decimal(
            item.get(
                "shippingPrice"
            )
        )

        if shipping_price is None:
            total_price = None
        else:
            total_price = (
                sold_price
                + shipping_price
            )

        best_offer_accepted = bool(
            item.get(
                "bestOfferAccepted",
                False,
            )
        )

        normalized_sales.append(
            {
                "external_sale_id": (
                    item.get(
                        "itemId"
                    )
                ),
                "title": title,
                "sale_price": (
                    sold_price
                ),
                "shipping_price": (
                    shipping_price
                ),
                "total_price": (
                    total_price
                ),
                "currency": currency,
                "sale_type": (
                    item.get(
                        "buyingFormat"
                    )
                    or "unknown"
                ),
                "category_id": (
                    item.get(
                        "categoryId"
                    )
                ),
                "bid_count": (
                    item.get(
                        "bidCount"
                    )
                ),
                "sold_at": (
                    item.get(
                        "endedAt"
                    )
                ),
                "seller_name": (
                    item.get(
                        "sellerUsername"
                    )
                ),
                "seller_feedback": (
                    _to_decimal(
                        item.get(
                            "sellerPositivePercent"
                        )
                    )
                ),
                "seller_feedback_score": (
                    item.get(
                        "sellerFeedbackScore"
                    )
                ),
                "listing_url": (
                    item.get(
                        "url"
                    )
                ),
                "image_url": (
                    item.get(
                        "fullResThumbnailUrl"
                    )
                    or item.get(
                        "thumbnailUrl"
                    )
                ),
                "best_offer_accepted": (
                    best_offer_accepted
                ),

                # Accepted Best Offers confirm the
                # item sold, but eBay does not expose
                # the true accepted transaction amount.
                "price_is_exact": (
                    not best_offer_accepted
                ),
                "item_location": (
                    item.get(
                        "itemLocation"
                    )
                ),
                "scraped_at": (
                    item.get(
                        "scrapedAt"
                    )
                ),
            }
        )

    return normalized_sales