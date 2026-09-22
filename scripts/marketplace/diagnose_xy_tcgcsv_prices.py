from __future__ import annotations

import requests


PRODUCTS = [
    {
        "name": "Flashfire Booster Box",
        "group_id": 1464,
        "product_id": 91594,
    },
    {
        "name": "Phantom Forces Booster Box",
        "group_id": 1494,
        "product_id": 94623,
    },
    {
        "name": "Ancient Origins Booster Box",
        "group_id": 1576,
        "product_id": 100489,
    },
    {
        "name": "BREAKpoint Booster Box",
        "group_id": 1701,
        "product_id": 111278,
    },
]


def main() -> None:
    session = requests.Session()

    session.headers.update(
        {
            "User-Agent": "TCGMVP/1.0 Price Diagnostic",
        }
    )

    for product in PRODUCTS:
        group_id = product["group_id"]
        product_id = product["product_id"]

        url = (
            "https://tcgcsv.com/"
            f"tcgplayer/3/{group_id}/prices"
        )

        response = session.get(
            url,
            timeout=30,
        )

        response.raise_for_status()

        prices = response.json().get(
            "results",
            [],
        )

        matches = [
            price
            for price in prices
            if price.get("productId")
            == product_id
        ]

        print()
        print("=" * 70)
        print(product["name"])
        print(f"Group ID: {group_id}")
        print(f"Product ID: {product_id}")
        print("=" * 70)

        if not matches:
            print(
                "NO PRICE OBJECT RETURNED BY TCGCSV"
            )
            continue

        for match in matches:
            print(
                f"Subtype: "
                f"{match.get('subTypeName')}"
            )
            print(
                f"Market price: "
                f"{match.get('marketPrice')}"
            )
            print(
                f"Low price: "
                f"{match.get('lowPrice')}"
            )
            print(
                f"Mid price: "
                f"{match.get('midPrice')}"
            )
            print(
                f"High price: "
                f"{match.get('highPrice')}"
            )


if __name__ == "__main__":
    main()