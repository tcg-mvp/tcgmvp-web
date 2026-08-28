from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]


REQUIRED_FIELDS = (
    "set_name",
    "set_slug",
    "set_code",
    "series_id",
    "release_date",
    "overview",
    "product_name",
    "product_slug",
    "image_filename",
    "tcgplayer_id",
    "tcgcsv_group_id",
    "ebay_query",
    "keywords",
)


def _print_header(
    title: str,
) -> None:
    print("")
    print("=" * 78)
    print(title)
    print("=" * 78)


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


def _validate_required_fields(
    product: dict[str, Any],
) -> list[str]:
    errors: list[str] = []

    for field in REQUIRED_FIELDS:
        value = product.get(field)

        if value is None:
            errors.append(
                f"Missing required field: {field}"
            )
            continue

        if (
            isinstance(value, str)
            and not value.strip()
        ):
            errors.append(
                f"Required field is blank: {field}"
            )

        if (
            field == "keywords"
            and (
                not isinstance(value, list)
                or not value
            )
        ):
            errors.append(
                "keywords must be a non-empty list"
            )

    return errors


def _validate_image(
    product: dict[str, Any],
) -> list[str]:
    errors: list[str] = []

    filename = str(
        product.get(
            "image_filename",
            "",
        )
    ).strip()

    if not filename:
        return [
            "image_filename is missing"
        ]

    if Path(filename).name != filename:
        errors.append(
            "image_filename must contain only "
            "the filename, not a path"
        )

        return errors

    image_path = (
        PROJECT_ROOT
        / "public"
        / "products"
        / filename
    )

    if not image_path.exists():
        errors.append(
            "Image does not exist: "
            f"public/products/{filename}"
        )

    if image_path.suffix.lower() not in (
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
    ):
        errors.append(
            "Unsupported image extension: "
            f"{image_path.suffix}"
        )

    return errors


def _validate_manifest_duplicates(
    products: list[dict[str, Any]],
) -> dict[int, list[str]]:
    errors: dict[int, list[str]] = {
        index: []
        for index in range(
            len(products)
        )
    }

    unique_fields = (
        "set_slug",
        "product_slug",
        "tcgplayer_id",
        "tcgcsv_group_id",
        "image_filename",
    )

    for field in unique_fields:
        seen: dict[str, int] = {}

        for index, product in enumerate(
            products
        ):
            value = product.get(field)

            if value is None:
                continue

            normalized = (
                str(value)
                .strip()
                .lower()
            )

            if not normalized:
                continue

            if normalized in seen:
                first_index = seen[
                    normalized
                ]

                errors[index].append(
                    f"Duplicate {field} in "
                    f"manifest: {value}"
                )

                errors[
                    first_index
                ].append(
                    f"Duplicate {field} in "
                    f"manifest: {value}"
                )

            else:
                seen[
                    normalized
                ] = index

    return errors


def _get_existing_database_values() -> dict[
    str,
    set[str],
]:
    supabase = get_supabase_client()

    products_response = (
        supabase
        .table("products")
        .select(
            "id,name,slug"
        )
        .execute()
    )

    sets_response = (
        supabase
        .table("sets")
        .select(
            "id,name,slug"
        )
        .execute()
    )

    identifiers_response = (
        supabase
        .table(
            "product_identifiers"
        )
        .select(
            "identifier_type,"
            "identifier_value"
        )
        .execute()
    )

    product_slugs = {
        str(row["slug"]).lower()
        for row in (
            products_response.data
            or []
        )
        if row.get("slug")
    }

    set_slugs = {
        str(row["slug"]).lower()
        for row in (
            sets_response.data
            or []
        )
        if row.get("slug")
    }

    tcgplayer_ids: set[str] = set()
    tcgcsv_group_ids: set[str] = set()

    for row in (
        identifiers_response.data
        or []
    ):
        identifier_type = str(
            row.get(
                "identifier_type",
                "",
            )
        )

        identifier_value = str(
            row.get(
                "identifier_value",
                "",
            )
        )

        if (
            identifier_type
            == "tcgplayer_id"
        ):
            tcgplayer_ids.add(
                identifier_value
            )

        elif (
            identifier_type
            == "tcgcsv_group_id"
        ):
            tcgcsv_group_ids.add(
                identifier_value
            )

    return {
        "product_slugs": product_slugs,
        "set_slugs": set_slugs,
        "tcgplayer_ids": tcgplayer_ids,
        "tcgcsv_group_ids": (
            tcgcsv_group_ids
        ),
    }


def _validate_database_conflicts(
    *,
    product: dict[str, Any],
    existing: dict[str, set[str]],
) -> list[str]:
    errors: list[str] = []

    product_slug = str(
        product.get(
            "product_slug",
            "",
        )
    ).strip().lower()

    set_slug = str(
        product.get(
            "set_slug",
            "",
        )
    ).strip().lower()

    tcgplayer_id = str(
        product.get(
            "tcgplayer_id",
            "",
        )
    ).strip()

    tcgcsv_group_id = str(
        product.get(
            "tcgcsv_group_id",
            "",
        )
    ).strip()

    if (
        product_slug
        in existing[
            "product_slugs"
        ]
    ):
        errors.append(
            "Product slug already exists "
            f"in database: {product_slug}"
        )

    if (
        set_slug
        in existing[
            "set_slugs"
        ]
    ):
        errors.append(
            "Set slug already exists "
            f"in database: {set_slug}"
        )

    if (
        tcgplayer_id
        in existing[
            "tcgplayer_ids"
        ]
    ):
        errors.append(
            "TCGPlayer ID already exists "
            f"in database: {tcgplayer_id}"
        )

    if (
        tcgcsv_group_id
        in existing[
            "tcgcsv_group_ids"
        ]
    ):
        errors.append(
            "TCGCSV group ID already exists "
            f"in database: "
            f"{tcgcsv_group_id}"
        )

    return errors


def validate_manifest(
    manifest_path: Path,
) -> bool:
    products = _load_manifest(
        manifest_path
    )

    duplicate_errors = (
        _validate_manifest_duplicates(
            products
        )
    )

    existing = (
        _get_existing_database_values()
    )

    total_passed = 0
    total_failed = 0

    _print_header(
        "TCGMVP CATALOG MANIFEST PREFLIGHT"
    )

    print(
        f"Manifest: {manifest_path}"
    )

    print(
        f"Products: {len(products)}"
    )

    for index, product in enumerate(
        products
    ):
        product_name = str(
            product.get(
                "product_name",
                f"Product #{index + 1}",
            )
        )

        print("")
        print("-" * 78)
        print(
            f"[{index + 1}] "
            f"{product_name}"
        )
        print("-" * 78)

        errors: list[str] = []

        errors.extend(
            _validate_required_fields(
                product
            )
        )

        errors.extend(
            _validate_image(
                product
            )
        )

        errors.extend(
            duplicate_errors[
                index
            ]
        )

        errors.extend(
            _validate_database_conflicts(
                product=product,
                existing=existing,
            )
        )

        if errors:
            total_failed += 1

            for error in errors:
                print(
                    f"  FAIL {error}"
                )

        else:
            total_passed += 1

            image_filename = (
                product[
                    "image_filename"
                ]
            )

            print(
                "  PASS Metadata complete"
            )

            print(
                "  PASS Image exists: "
                f"public/products/"
                f"{image_filename}"
            )

            print(
                "  PASS Manifest uniqueness"
            )

            print(
                "  PASS No database "
                "conflicts"
            )

            print(
                "  READY TO ONBOARD"
            )

    print("")
    print("=" * 78)
    print("PREFLIGHT SUMMARY")
    print("=" * 78)

    print(
        f"Products ready: "
        f"{total_passed}"
    )

    print(
        f"Products failed: "
        f"{total_failed}"
    )

    ready = (
        total_failed == 0
    )

    print("")

    print(
        "Batch Ready: "
        f"{'YES' if ready else 'NO'}"
    )

    print("=" * 78)

    return ready


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Validate a TCGMVP catalog "
            "manifest before onboarding."
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

    ready = validate_manifest(
        manifest_path
    )

    if not ready:
        raise SystemExit(1)


if __name__ == "__main__":
    main()