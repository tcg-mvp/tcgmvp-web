from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from scripts.marketplace.preflight_catalog_manifest import (
    PROJECT_ROOT,
)
from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


def _load_manifest(
    manifest_path: Path,
) -> list[dict[str, Any]]:
    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest does not exist: "
            f"{manifest_path}"
        )

    with manifest_path.open(
        "r",
        encoding="utf-8",
    ) as file:
        payload = json.load(file)

    if isinstance(payload, list):
        products = payload

    elif (
        isinstance(payload, dict)
        and isinstance(
            payload.get("products"),
            list,
        )
    ):
        products = payload["products"]

    else:
        raise ValueError(
            "Manifest must either be a JSON array "
            "or an object containing a "
            "'products' array."
        )

    if not products:
        raise ValueError(
            "Manifest contains no products."
        )

    return products


def _resolve_product_ids(
    products: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    supabase = get_supabase_client()

    resolved: list[dict[str, Any]] = []
    errors: list[str] = []

    for product in products:
        product_slug = str(
            product.get(
                "product_slug",
                "",
            )
        ).strip()

        product_name = str(
            product.get(
                "product_name",
                product_slug,
            )
        ).strip()

        if not product_slug:
            errors.append(
                f"{product_name}: "
                "product_slug is missing"
            )
            continue

        response = (
            supabase
            .table("products")
            .select(
                "id,name,slug"
            )
            .eq(
                "slug",
                product_slug,
            )
            .execute()
        )

        rows = (
            response.data
            or []
        )

        if len(rows) == 0:
            errors.append(
                f"{product_name}: "
                "no database product found "
                f"for slug "
                f"'{product_slug}'"
            )
            continue

        if len(rows) > 1:
            errors.append(
                f"{product_name}: "
                "multiple database products "
                f"found for slug "
                f"'{product_slug}'"
            )
            continue

        row = rows[0]

        resolved.append(
            {
                "product_id": int(
                    row["id"]
                ),
                "product_name": str(
                    row["name"]
                ),
                "product_slug": str(
                    row["slug"]
                ),
            }
        )

    if errors:
        print("")
        print("=" * 78)
        print(
            "PRODUCT RESOLUTION FAILED"
        )
        print("=" * 78)

        for error in errors:
            print(
                f"FAIL {error}"
            )

        print("=" * 78)

        raise RuntimeError(
            "One or more manifest products "
            "could not be resolved."
        )

    return resolved


def batch_validate_products(
    manifest_path: Path,
) -> dict[str, Any]:
    print("")
    print("=" * 78)
    print(
        "TCGMVP BATCH PRODUCT VALIDATION"
    )
    print("=" * 78)
    print(
        f"Manifest: {manifest_path}"
    )

    products = _load_manifest(
        manifest_path
    )

    resolved_products = (
        _resolve_product_ids(
            products
        )
    )

    print(
        f"Products resolved: "
        f"{len(resolved_products)}"
    )

    successful = 0
    failed = 0

    results: list[
        dict[str, Any]
    ] = []

    for index, product in enumerate(
        resolved_products,
        start=1,
    ):
        product_id = int(
            product["product_id"]
        )

        product_name = str(
            product["product_name"]
        )

        print("")
        print("#" * 78)
        print(
            f"[{index}/"
            f"{len(resolved_products)}] "
            f"{product_name}"
        )
        print(
            f"Product ID: {product_id}"
        )
        print("#" * 78)

        command = [
            sys.executable,
            "-m",
            (
                "scripts.marketplace."
                "validate_product_onboarding"
            ),
            "--product-id",
            str(product_id),
        ]

        completed = subprocess.run(
            command,
            cwd=PROJECT_ROOT,
        )

        if completed.returncode == 0:
            successful += 1

            results.append(
                {
                    "product_id": (
                        product_id
                    ),
                    "product_name": (
                        product_name
                    ),
                    "status": "success",
                }
            )

        else:
            failed += 1

            results.append(
                {
                    "product_id": (
                        product_id
                    ),
                    "product_name": (
                        product_name
                    ),
                    "status": "failed",
                    "returncode": (
                        completed.returncode
                    ),
                }
            )

    print("")
    print("=" * 78)
    print(
        "BATCH VALIDATION SUMMARY"
    )
    print("=" * 78)

    print(
        f"Products attempted: "
        f"{len(resolved_products)}"
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
                    f"- Product "
                    f"{result['product_id']}: "
                    f"{result['product_name']}"
                )

    print("")
    print(
        "Batch Validation: "
        f"{'PASS' if failed == 0 else 'FAIL'}"
    )

    print("=" * 78)

    return {
        "success": failed == 0,
        "products_attempted": (
            len(resolved_products)
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
            "Validate every TCGMVP product "
            "contained in a catalog manifest."
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

    result = batch_validate_products(
        manifest_path
    )

    if not result["success"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()