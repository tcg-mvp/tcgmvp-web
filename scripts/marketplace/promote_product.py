from __future__ import annotations

import argparse
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)
from scripts.marketplace.validate_product_onboarding import (
    validate_product,
)


def _get_product(
    product_id: int,
) -> dict[str, Any]:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("products")
        .select(
            "id,"
            "name,"
            "slug,"
            "active,"
            "active_for_import"
        )
        .eq(
            "id",
            product_id,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise LookupError(
            f"No product found for product_id={product_id}."
        )

    return rows[0]


def _update_product_state(
    *,
    product_id: int,
    active: bool | None = None,
    active_for_import: bool | None = None,
) -> dict[str, Any]:
    supabase = get_supabase_client()

    updates: dict[str, Any] = {}

    if active is not None:
        updates["active"] = active

    if active_for_import is not None:
        updates[
            "active_for_import"
        ] = active_for_import

    if not updates:
        raise ValueError(
            "No product-state updates were supplied."
        )

    response = (
        supabase
        .table("products")
        .update(
            updates
        )
        .eq(
            "id",
            product_id,
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Product update returned no data."
        )

    return rows[0]


def enable_import(
    product_id: int,
) -> None:
    product = _get_product(
        product_id
    )

    validation = validate_product(
        product_id
    )

    print("=" * 78)
    print("TCGMVP PRODUCT PROMOTION")
    print("=" * 78)

    print(
        f"Product: {product['name']}"
    )

    print(
        f"Product ID: {product_id}"
    )

    print("")

    if not validation[
        "configuration_ready"
    ]:
        raise RuntimeError(
            "Cannot enable market import because "
            "Configuration Ready is NO."
        )

    if product.get(
        "active_for_import"
    ) is True:
        print(
            "Market import is already enabled."
        )

        print("=" * 78)

        return

    updated = _update_product_state(
        product_id=product_id,
        active_for_import=True,
    )

    print(
        "Market import enabled."
    )

    print(
        "active_for_import = "
        f"{updated.get('active_for_import')}"
    )

    print("")

    print(
        "Next step:"
    )

    print(
        "  python -m "
        "scripts.marketplace.run_market_pipeline"
    )

    print("=" * 78)


def publish_product(
    product_id: int,
) -> None:
    product = _get_product(
        product_id
    )

    validation = validate_product(
        product_id
    )

    print("=" * 78)
    print("TCGMVP PRODUCT PUBLISH")
    print("=" * 78)

    print(
        f"Product: {product['name']}"
    )

    print(
        f"Product ID: {product_id}"
    )

    print("")

    if not validation[
        "configuration_ready"
    ]:
        raise RuntimeError(
            "Cannot publish because "
            "Configuration Ready is NO."
        )

    if not validation[
        "pipeline_ready"
    ]:
        raise RuntimeError(
            "Cannot publish because "
            "Pipeline Ready is NO."
        )

    if not validation[
        "market_data_ready"
    ]:
        raise RuntimeError(
            "Cannot publish because "
            "Market Data Ready is NO."
        )

    if product.get(
        "active"
    ) is True:
        print(
            "Product is already published."
        )

        print("=" * 78)

        return

    updated = _update_product_state(
        product_id=product_id,
        active=True,
    )

    print(
        "Product published."
    )

    print(
        "active = "
        f"{updated.get('active')}"
    )

    print("")

    print(
        "Next step:"
    )

    print(
        "  python -m "
        "scripts.marketplace."
        "validate_product_onboarding "
        f"--product-id {product_id}"
    )

    print("=" * 78)


def unpublish_product(
    product_id: int,
) -> None:
    product = _get_product(
        product_id
    )

    print("=" * 78)
    print("TCGMVP PRODUCT UNPUBLISH")
    print("=" * 78)

    print(
        f"Product: {product['name']}"
    )

    print(
        f"Product ID: {product_id}"
    )

    print("")

    if product.get(
        "active"
    ) is False:
        print(
            "Product is already unpublished."
        )

        print("=" * 78)

        return

    updated = _update_product_state(
        product_id=product_id,
        active=False,
    )

    print(
        "Product unpublished."
    )

    print(
        "active = "
        f"{updated.get('active')}"
    )

    print("=" * 78)


def disable_import(
    product_id: int,
) -> None:
    product = _get_product(
        product_id
    )

    print("=" * 78)
    print("TCGMVP IMPORT DISABLE")
    print("=" * 78)

    print(
        f"Product: {product['name']}"
    )

    print(
        f"Product ID: {product_id}"
    )

    print("")

    if product.get(
        "active_for_import"
    ) is False:
        print(
            "Market import is already disabled."
        )

        print("=" * 78)

        return

    updated = _update_product_state(
        product_id=product_id,
        active_for_import=False,
    )

    print(
        "Market import disabled."
    )

    print(
        "active_for_import = "
        f"{updated.get('active_for_import')}"
    )

    print("=" * 78)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Safely promote or demote "
            "TCGMVP products."
        )
    )

    parser.add_argument(
        "--product-id",
        type=int,
        required=True,
    )

    action_group = (
        parser.add_mutually_exclusive_group(
            required=True
        )
    )

    action_group.add_argument(
        "--enable-import",
        action="store_true",
    )

    action_group.add_argument(
        "--publish",
        action="store_true",
    )

    action_group.add_argument(
        "--unpublish",
        action="store_true",
    )

    action_group.add_argument(
        "--disable-import",
        action="store_true",
    )

    args = parser.parse_args()

    if args.enable_import:
        enable_import(
            args.product_id
        )

    elif args.publish:
        publish_product(
            args.product_id
        )

    elif args.unpublish:
        unpublish_product(
            args.product_id
        )

    elif args.disable_import:
        disable_import(
            args.product_id
        )


if __name__ == "__main__":
    main()