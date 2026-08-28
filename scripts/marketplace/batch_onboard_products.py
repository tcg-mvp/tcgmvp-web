from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from scripts.marketplace.onboard_product import (
    onboard_product,
)
from scripts.marketplace.preflight_catalog_manifest import (
    PROJECT_ROOT,
    validate_manifest,
)


def _load_manifest(
    manifest_path: Path,
) -> list[dict[str, Any]]:
    with manifest_path.open(
        "r",
        encoding="utf-8",
    ) as file:
        payload = json.load(file)

    if isinstance(payload, list):
        return payload

    if (
        isinstance(payload, dict)
        and isinstance(
            payload.get("products"),
            list,
        )
    ):
        return payload["products"]

    raise ValueError(
        "Manifest must either be a JSON array "
        "or an object containing a 'products' array."
    )


def _build_onboarding_kwargs(
    product: dict[str, Any],
) -> dict[str, Any]:
    image_filename = str(
        product["image_filename"]
    ).strip()

    image_url = (
        f"/products/{image_filename}"
    )

    return {
        "set_name": product["set_name"],
        "set_slug": product["set_slug"],
        "set_code": product["set_code"],
        "series_id": int(
            product["series_id"]
        ),
        "release_date": (
            product["release_date"]
        ),
        "overview": product["overview"],
        "product_name": (
            product["product_name"]
        ),
        "product_slug": (
            product["product_slug"]
        ),
        "image_url": image_url,
        "tcgplayer_id": str(
            product["tcgplayer_id"]
        ),
        "tcgcsv_group_id": str(
            product["tcgcsv_group_id"]
        ),
        "ebay_query": (
            product["ebay_query"]
        ),
        "keywords": tuple(
            str(keyword)
            for keyword
            in product["keywords"]
        ),
        "game_id": int(
            product.get(
                "game_id",
                1,
            )
        ),
        "language_id": int(
            product.get(
                "language_id",
                1,
            )
        ),
        "product_type_id": int(
            product.get(
                "product_type_id",
                1,
            )
        ),
        "packs_per_product": int(
            product.get(
                "packs_per_product",
                36,
            )
        ),
        "cards_per_pack": int(
            product.get(
                "cards_per_pack",
                10,
            )
        ),
        "description": product.get(
            "description"
        ),
        "msrp": product.get(
            "msrp"
        ),
    }


def batch_onboard_products(
    manifest_path: Path,
) -> dict[str, Any]:
    print("")
    print("=" * 78)
    print(
        "TCGMVP BATCH PRODUCT ONBOARDING"
    )
    print("=" * 78)
    print(
        f"Manifest: {manifest_path}"
    )

    print("")
    print(
        "Running manifest preflight..."
    )

    ready = validate_manifest(
        manifest_path
    )

    if not ready:
        print("")
        print(
            "Batch onboarding aborted."
        )
        print(
            "Fix the preflight failures "
            "and rerun."
        )

        return {
            "success": False,
            "products_attempted": 0,
            "products_successful": 0,
            "products_failed": 0,
            "results": [],
        }

    products = _load_manifest(
        manifest_path
    )

    print("")
    print("=" * 78)
    print(
        "PREFLIGHT PASSED — "
        "STARTING ONBOARDING"
    )
    print("=" * 78)

    successful = 0
    failed = 0

    results: list[dict[str, Any]] = []

    for index, product in enumerate(
        products,
        start=1,
    ):
        product_name = str(
            product["product_name"]
        )

        print("")
        print("-" * 78)
        print(
            f"[{index}/{len(products)}] "
            f"{product_name}"
        )
        print("-" * 78)

        try:
            kwargs = (
                _build_onboarding_kwargs(
                    product
                )
            )

            result = onboard_product(
                **kwargs
            )

            successful += 1

            results.append(
                {
                    "name": product_name,
                    "status": "success",
                    "result": result,
                }
            )

            print(
                f"SUCCESS: {product_name}"
            )

        except Exception as exc:
            failed += 1

            results.append(
                {
                    "name": product_name,
                    "status": "failed",
                    "error": str(exc),
                }
            )

            print(
                f"FAILED: {product_name}"
            )
            print(
                f"Reason: {exc}"
            )

    print("")
    print("=" * 78)
    print(
        "BATCH ONBOARDING SUMMARY"
    )
    print("=" * 78)

    print(
        f"Products attempted: "
        f"{len(products)}"
    )

    print(
        f"Products successful: "
        f"{successful}"
    )

    print(
        f"Products failed: "
        f"{failed}"
    )

    if failed:
        print("")
        print("Failures:")

        for result in results:
            if (
                result["status"]
                == "failed"
            ):
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )

    print("=" * 78)

    return {
        "success": failed == 0,
        "products_attempted": (
            len(products)
        ),
        "products_successful": (
            successful
        ),
        "products_failed": failed,
        "results": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Batch onboard TCGMVP "
            "products from a validated "
            "catalog manifest."
        )
    )

    parser.add_argument(
        "manifest",
        help=(
            "Path to JSON catalog manifest."
        ),
    )

    args = parser.parse_args()

    manifest_path = Path(
        args.manifest
    )

    if not manifest_path.is_absolute():
        manifest_path = (
            PROJECT_ROOT
            / manifest_path
        )

    result = batch_onboard_products(
        manifest_path
    )

    if not result["success"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()