from __future__ import annotations

import requests


GROUPS_URL = "https://tcgcsv.com/tcgplayer/3/groups"

TARGET_SETS = [
    "XY Base Set",
    "XY - Flashfire",
    "XY - Furious Fists",
    "XY - Phantom Forces",
    "XY - Primal Clash",
    "XY - Roaring Skies",
    "XY - Ancient Origins",
    "XY - BREAKthrough",
    "XY - BREAKpoint",
    "XY - Fates Collide",
    "XY - Steam Siege",
    "XY - Evolutions",
]


def main() -> None:
    session = requests.Session()

    session.headers.update(
        {
            "User-Agent": "TCGMVP/1.0 Catalog Discovery",
        }
    )

    response = session.get(
        GROUPS_URL,
        timeout=30,
    )

    response.raise_for_status()

    groups = response.json()["results"]

    groups_by_name = {
        group["name"]: group
        for group in groups
    }

    print()
    print("=" * 80)
    print("TCGMVP XY BOOSTER BOX DISCOVERY")
    print("=" * 80)

    for target_name in TARGET_SETS:
        print()
        print("-" * 80)
        print(target_name)
        print("-" * 80)

        group = groups_by_name.get(
            target_name
        )

        if group is None:
            print("GROUP NOT FOUND")
            continue

        group_id = group["groupId"]

        print(
            f"TCGCSV group ID: {group_id}"
        )

        print(
            f"Abbreviation: {group.get('abbreviation')}"
        )

        print(
            f"Published: {group.get('publishedOn')}"
        )

        products_url = (
            "https://tcgcsv.com/"
            f"tcgplayer/3/{group_id}/products"
        )

        products_response = session.get(
            products_url,
            timeout=30,
        )

        products_response.raise_for_status()

        products = (
            products_response
            .json()["results"]
        )

        booster_boxes = [
            product
            for product in products
            if (
                "booster box"
                in product["name"].lower()
                and "case"
                not in product["name"].lower()
                and "code card"
                not in product["name"].lower()
            )
        ]

        if not booster_boxes:
            print(
                "NO BOOSTER BOX CANDIDATE FOUND"
            )
            continue

        for product in booster_boxes:
            print(
                "Candidate:"
            )
            print(
                f"  Product ID: "
                f"{product['productId']}"
            )
            print(
                f"  Name: "
                f"{product['name']}"
            )

    print()
    print("=" * 80)


if __name__ == "__main__":
    main()