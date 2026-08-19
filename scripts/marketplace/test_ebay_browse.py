from __future__ import annotations

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


def main() -> None:
    token = get_application_token()

    params = {
        "q": "Evolving Skies Booster Box",
        "limit": "50",
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    }

    print("")
    print("Searching eBay Production...")
    print("Query: Evolving Skies Booster Box")
    print("")

    response = requests.get(
        EBAY_BROWSE_URL,
        headers=headers,
        params=params,
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
    valid_items = [
    item
    for item in items
    if is_valid_booster_box_listing(
        title=item.get("title", ""),
        condition=item.get("condition"),
        product_keywords=(
            "evolving skies",
            "booster box",
        ),
    )
]

    print(f"Total matching results reported: {payload.get('total')}")
    print(f"Raw results returned: {len(items)}")
    print(f"Valid booster boxes: {len(valid_items)}")
    print("")

    for index, item in enumerate(valid_items, start=1):
        price = item.get("price") or {}

        seller = item.get("seller") or {}
        shipping_options = item.get("shippingOptions") or []

        shipping_cost = None

        if shipping_options:
            shipping = shipping_options[0]
            shipping_cost_data = shipping.get("shippingCost") or {}
            shipping_cost = shipping_cost_data.get("value")

        print(f"--- Result {index} ---")
        print(f"Title: {item.get('title')}")
        print(f"Item ID: {item.get('itemId')}")
        print(
            f"Price: "
            f"{price.get('value')} "
            f"{price.get('currency')}"
        )
        print(f"Condition: {item.get('condition')}")
        print(f"Buying options: {item.get('buyingOptions')}")
        print(f"Seller: {seller.get('username')}")
        print(
            f"Seller feedback: "
            f"{seller.get('feedbackPercentage')}"
        )
        print(f"Shipping: {shipping_cost}")
        print(f"URL: {item.get('itemWebUrl')}")
        print("")


if __name__ == "__main__":
    main()