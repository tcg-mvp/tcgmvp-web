from __future__ import annotations

import argparse
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


DEFAULT_GAME_ID = 1
DEFAULT_LANGUAGE_ID = 1
DEFAULT_PRODUCT_TYPE_ID = 1

DEFAULT_TCGPLAYER_MARKETPLACE_ID = 2

DEFAULT_PACKS_PER_PRODUCT = 36
DEFAULT_CARDS_PER_PACK = 10

EBAY_MARKETPLACE = "ebay"


def _clean_text(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    return (
        cleaned
        if cleaned
        else None
    )


def _require_positive_integer(
    value: int,
    name: str,
) -> None:
    if value <= 0:
        raise ValueError(
            f"{name} must be greater than 0."
        )


def _verify_reference_row(
    *,
    table: str,
    row_id: int,
    label: str,
) -> dict[str, Any]:
    supabase = get_supabase_client()

    response = (
        supabase
        .table(table)
        .select("*")
        .eq(
            "id",
            row_id,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise LookupError(
            f"{label} ID {row_id} "
            f"does not exist in {table}."
        )

    return rows[0]


def _find_set_by_slug(
    slug: str,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("sets")
        .select("*")
        .eq(
            "slug",
            slug,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _find_set_by_name_language(
    *,
    name: str,
    language_id: int,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("sets")
        .select("*")
        .eq(
            "name",
            name,
        )
        .eq(
            "language_id",
            language_id,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _get_or_create_set(
    *,
    name: str,
    slug: str,
    set_code: str | None,
    series_id: int,
    language_id: int,
    release_date: str | None,
    overview: str | None,
) -> tuple[
    dict[str, Any],
    bool,
]:
    """
    Reuse an existing set when it can be
    unambiguously identified.

    Otherwise create a new set.

    Returns:
        (
            set_row,
            created,
        )
    """
    by_slug = _find_set_by_slug(
        slug
    )

    by_name_language = (
        _find_set_by_name_language(
            name=name,
            language_id=language_id,
        )
    )

    if (
        by_slug is not None
        and by_name_language is not None
        and int(
            by_slug["id"]
        )
        != int(
            by_name_language["id"]
        )
    ):
        raise ValueError(
            "Set conflict detected: the supplied "
            "slug and name/language combination "
            "match different existing sets."
        )

    existing = (
        by_slug
        or by_name_language
    )

    if existing is not None:
        existing_name = str(
            existing.get(
                "name"
            )
            or ""
        ).strip()

        existing_slug = str(
            existing.get(
                "slug"
            )
            or ""
        ).strip()

        if existing_name != name:
            raise ValueError(
                "Existing set slug belongs to "
                f"'{existing_name}', not '{name}'."
            )

        if existing_slug != slug:
            raise ValueError(
                "Existing set name/language "
                "combination uses slug "
                f"'{existing_slug}', not '{slug}'."
            )

        if (
            existing.get(
                "series_id"
            )
            is not None
            and int(
                existing[
                    "series_id"
                ]
            )
            != series_id
        ):
            raise ValueError(
                "Existing set uses a different "
                "series_id."
            )

        print(
            "Set already exists:"
        )

        print(
            f"  ID: {existing['id']}"
        )

        print(
            f"  Name: {existing_name}"
        )

        print(
            f"  Slug: {existing_slug}"
        )

        return (
            existing,
            False,
        )

    supabase = get_supabase_client()

    row = {
        "series_id":
            series_id,

        "language_id":
            language_id,

        "name":
            name,

        "slug":
            slug,

        "set_code":
            set_code,

        "release_date":
            release_date,

        "overview":
            overview,

        "active":
            True,
    }

    response = (
        supabase
        .table("sets")
        .insert(
            row
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Set insert returned no data."
        )

    created = rows[0]

    print(
        "Created set:"
    )

    print(
        f"  ID: {created['id']}"
    )

    print(
        f"  Name: {created['name']}"
    )

    return (
        created,
        True,
    )


def _find_product_by_slug(
    slug: str,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("products")
        .select("*")
        .eq(
            "slug",
            slug,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _find_product_by_name(
    name: str,
) -> list[dict[str, Any]]:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("products")
        .select("*")
        .eq(
            "name",
            name,
        )
        .execute()
    )

    return (
        response.data
        or []
    )


def _get_or_create_product(
    *,
    game_id: int,
    set_id: int,
    language_id: int,
    product_type_id: int,
    name: str,
    slug: str,
    release_date: str | None,
    msrp: str | None,
    packs_per_product: int,
    cards_per_pack: int,
    image_url: str | None,
    description: str | None,
) -> tuple[
    dict[str, Any],
    bool,
]:
    """
    Create the product as an inactive draft.

    Existing products are reused rather than
    duplicated.
    """
    existing = _find_product_by_slug(
        slug
    )

    if existing is not None:
        if (
            str(
                existing.get(
                    "name"
                )
                or ""
            ).strip()
            != name
        ):
            raise ValueError(
                "Product slug already exists "
                "for a different product name."
            )

        print(
            "Product already exists:"
        )

        print(
            f"  ID: {existing['id']}"
        )

        print(
            f"  Name: {existing['name']}"
        )

        print(
            f"  Slug: {existing['slug']}"
        )

        return (
            existing,
            False,
        )

    same_name_products = (
        _find_product_by_name(
            name
        )
    )

    if same_name_products:
        raise ValueError(
            f"A product named '{name}' already "
            "exists with a different slug. "
            "Review the existing product before "
            "creating another."
        )

    supabase = get_supabase_client()

    row: dict[str, Any] = {
        "game_id":
            game_id,

        "set_id":
            set_id,

        "language_id":
            language_id,

        "product_type_id":
            product_type_id,

        "name":
            name,

        "slug":
            slug,

        "release_date":
            release_date,

        "packs_per_product":
            packs_per_product,

        "cards_per_pack":
            cards_per_pack,

        "image_url":
            image_url,

        "description":
            description,

        "category":
            "sealed",

        "active":
            False,

        "active_for_import":
            False,

        "featured":
            False,
    }

    if msrp is not None:
        row[
            "msrp"
        ] = msrp

    response = (
        supabase
        .table("products")
        .insert(
            row
        )
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise RuntimeError(
            "Product insert returned no data."
        )

    created = rows[0]

    print(
        "Created draft product:"
    )

    print(
        f"  ID: {created['id']}"
    )

    print(
        f"  Name: {created['name']}"
    )

    print(
        "  active: false"
    )

    print(
        "  active_for_import: false"
    )

    return (
        created,
        True,
    )


def _find_identifier(
    *,
    marketplace_id: int,
    identifier_type: str,
    identifier_value: str,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_identifiers"
        )
        .select("*")
        .eq(
            "marketplace_id",
            marketplace_id,
        )
        .eq(
            "identifier_type",
            identifier_type,
        )
        .eq(
            "identifier_value",
            identifier_value,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _ensure_identifier(
    *,
    product_id: int,
    marketplace_id: int,
    identifier_type: str,
    identifier_value: str,
) -> bool:
    """
    Ensure one external identifier exists.

    Returns True if created.
    """
    existing = _find_identifier(
        marketplace_id=marketplace_id,
        identifier_type=identifier_type,
        identifier_value=identifier_value,
    )

    if existing is not None:
        existing_product_id = int(
            existing[
                "product_id"
            ]
        )

        if (
            existing_product_id
            != product_id
        ):
            raise ValueError(
                f"{identifier_type}="
                f"{identifier_value} already "
                f"belongs to product_id="
                f"{existing_product_id}."
            )

        print(
            "Identifier already exists:"
        )

        print(
            f"  {identifier_type}: "
            f"{identifier_value}"
        )

        return False

    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_identifiers"
        )
        .insert(
            {
                "product_id":
                    product_id,

                "marketplace_id":
                    marketplace_id,

                "identifier_type":
                    identifier_type,

                "identifier_value":
                    identifier_value,
            }
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Identifier insert returned "
            "no data."
        )

    print(
        "Created identifier:"
    )

    print(
        f"  {identifier_type}: "
        f"{identifier_value}"
    )

    return True


def _get_ebay_config(
    product_id: int,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_marketplace_config"
        )
        .select("*")
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace",
            EBAY_MARKETPLACE,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _ensure_ebay_config(
    *,
    product_id: int,
    search_query: str,
    product_keywords: list[str],
) -> bool:
    """
    Ensure the product has one eBay collection
    configuration.

    Existing configuration is validated but not
    silently overwritten.
    """
    existing = _get_ebay_config(
        product_id
    )

    if existing is not None:
        existing_query = str(
            existing.get(
                "search_query"
            )
            or ""
        ).strip()

        existing_keywords = [
            str(
                keyword
            ).strip()
            for keyword
            in (
                existing.get(
                    "product_keywords"
                )
                or []
            )
        ]

        if (
            existing_query
            != search_query
        ):
            raise ValueError(
                "Existing eBay configuration "
                "uses a different search_query."
            )

        if (
            existing_keywords
            != product_keywords
        ):
            raise ValueError(
                "Existing eBay configuration "
                "uses different product_keywords."
            )

        print(
            "eBay configuration already exists."
        )

        return False

    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_marketplace_config"
        )
        .insert(
            {
                "product_id":
                    product_id,

                "marketplace":
                    EBAY_MARKETPLACE,

                "search_query":
                    search_query,

                "product_keywords":
                    product_keywords,

                "active":
                    True,
            }
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "eBay configuration insert "
            "returned no data."
        )

    print(
        "Created eBay marketplace configuration."
    )

    return True


def onboard_product(
    *,
    set_name: str,
    set_slug: str,
    set_code: str | None,
    series_id: int,
    release_date: str | None,
    overview: str | None,
    product_name: str,
    product_slug: str,
    image_url: str | None,
    tcgplayer_id: str,
    tcgcsv_group_id: str,
    ebay_query: str,
    keywords: list[str],
    game_id: int,
    language_id: int,
    product_type_id: int,
    packs_per_product: int,
    cards_per_pack: int,
    msrp: str | None,
    description: str | None,
) -> dict[str, Any]:
    """
    Safely create or reuse the database records
    required to onboard a TCGMVP sealed product.

    New products are always created as inactive
    drafts.
    """
    _require_positive_integer(
        game_id,
        "game_id",
    )

    _require_positive_integer(
        language_id,
        "language_id",
    )

    _require_positive_integer(
        product_type_id,
        "product_type_id",
    )

    _require_positive_integer(
        series_id,
        "series_id",
    )

    _require_positive_integer(
        packs_per_product,
        "packs_per_product",
    )

    _require_positive_integer(
        cards_per_pack,
        "cards_per_pack",
    )

    if not tcgplayer_id.strip():
        raise ValueError(
            "tcgplayer_id is required."
        )

    if not tcgcsv_group_id.strip():
        raise ValueError(
            "tcgcsv_group_id is required."
        )

    if not ebay_query.strip():
        raise ValueError(
            "ebay_query is required."
        )

    cleaned_keywords = [
        keyword.strip()
        for keyword
        in keywords
        if keyword.strip()
    ]

    if not cleaned_keywords:
        raise ValueError(
            "At least one eBay product "
            "keyword is required."
        )

    print("=" * 78)

    print(
        "TCGMVP PRODUCT ONBOARDING"
    )

    print("=" * 78)

    print(
        f"Product: {product_name}"
    )

    print(
        f"Set: {set_name}"
    )

    print("")


    # Verify all referenced parent rows before
    # performing any writes.

    _verify_reference_row(
        table="games",
        row_id=game_id,
        label="Game",
    )

    _verify_reference_row(
        table="languages",
        row_id=language_id,
        label="Language",
    )

    _verify_reference_row(
        table="product_types",
        row_id=product_type_id,
        label="Product type",
    )

    _verify_reference_row(
        table="series",
        row_id=series_id,
        label="Series",
    )


    set_row, set_created = (
        _get_or_create_set(
            name=set_name,
            slug=set_slug,
            set_code=set_code,
            series_id=series_id,
            language_id=language_id,
            release_date=release_date,
            overview=overview,
        )
    )


    product_row, product_created = (
        _get_or_create_product(
            game_id=game_id,
            set_id=int(
                set_row["id"]
            ),
            language_id=language_id,
            product_type_id=(
                product_type_id
            ),
            name=product_name,
            slug=product_slug,
            release_date=release_date,
            msrp=msrp,
            packs_per_product=(
                packs_per_product
            ),
            cards_per_pack=(
                cards_per_pack
            ),
            image_url=image_url,
            description=description,
        )
    )


    product_id = int(
        product_row[
            "id"
        ]
    )


    tcgplayer_created = (
        _ensure_identifier(
            product_id=product_id,
            marketplace_id=(
                DEFAULT_TCGPLAYER_MARKETPLACE_ID
            ),
            identifier_type=(
                "tcgplayer_id"
            ),
            identifier_value=(
                tcgplayer_id.strip()
            ),
        )
    )


    group_created = (
        _ensure_identifier(
            product_id=product_id,
            marketplace_id=(
                DEFAULT_TCGPLAYER_MARKETPLACE_ID
            ),
            identifier_type=(
                "tcgcsv_group_id"
            ),
            identifier_value=(
                tcgcsv_group_id.strip()
            ),
        )
    )


    ebay_created = (
        _ensure_ebay_config(
            product_id=product_id,
            search_query=(
                ebay_query.strip()
            ),
            product_keywords=(
                cleaned_keywords
            ),
        )
    )


    print("")

    print("-" * 78)

    print(
        "ONBOARDING RESULT"
    )

    print("-" * 78)

    print(
        f"Product ID: "
        f"{product_id}"
    )

    print(
        "Set: "
        + (
            "CREATED"
            if set_created
            else "REUSED"
        )
    )

    print(
        "Product: "
        + (
            "CREATED"
            if product_created
            else "REUSED"
        )
    )

    print(
        "TCGPlayer ID: "
        + (
            "CREATED"
            if tcgplayer_created
            else "EXISTS"
        )
    )

    print(
        "TCGCSV group ID: "
        + (
            "CREATED"
            if group_created
            else "EXISTS"
        )
    )

    print(
        "eBay config: "
        + (
            "CREATED"
            if ebay_created
            else "EXISTS"
        )
    )

    print("")

    print(
        "Draft safety:"
    )

    print(
        "  active = false"
    )

    print(
        "  active_for_import = false"
    )

    print("")

    print(
        "Next validation command:"
    )

    print(
        "  python -m "
        "scripts.marketplace."
        "validate_product_onboarding "
        f"--product-id {product_id}"
    )

    print("=" * 78)


    return {
        "product_id":
            product_id,

        "set_id":
            int(
                set_row[
                    "id"
                ]
            ),

        "set_created":
            set_created,

        "product_created":
            product_created,

        "tcgplayer_identifier_created":
            tcgplayer_created,

        "tcgcsv_group_identifier_created":
            group_created,

        "ebay_config_created":
            ebay_created,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Safely onboard a draft TCGMVP "
            "sealed product."
        )
    )


    parser.add_argument(
        "--set-name",
        required=True,
    )

    parser.add_argument(
        "--set-slug",
        required=True,
    )

    parser.add_argument(
        "--set-code",
    )

    parser.add_argument(
        "--series-id",
        type=int,
        required=True,
    )

    parser.add_argument(
        "--release-date",
    )

    parser.add_argument(
        "--overview",
    )


    parser.add_argument(
        "--product-name",
        required=True,
    )

    parser.add_argument(
        "--product-slug",
        required=True,
    )

    parser.add_argument(
        "--image-url",
    )

    parser.add_argument(
        "--description",
    )

    parser.add_argument(
        "--msrp",
    )


    parser.add_argument(
        "--tcgplayer-id",
        required=True,
    )

    parser.add_argument(
        "--tcgcsv-group-id",
        required=True,
    )


    parser.add_argument(
        "--ebay-query",
        required=True,
    )

    parser.add_argument(
        "--keywords",
        nargs="+",
        required=True,
    )


    parser.add_argument(
        "--game-id",
        type=int,
        default=(
            DEFAULT_GAME_ID
        ),
    )

    parser.add_argument(
        "--language-id",
        type=int,
        default=(
            DEFAULT_LANGUAGE_ID
        ),
    )

    parser.add_argument(
        "--product-type-id",
        type=int,
        default=(
            DEFAULT_PRODUCT_TYPE_ID
        ),
    )

    parser.add_argument(
        "--packs-per-product",
        type=int,
        default=(
            DEFAULT_PACKS_PER_PRODUCT
        ),
    )

    parser.add_argument(
        "--cards-per-pack",
        type=int,
        default=(
            DEFAULT_CARDS_PER_PACK
        ),
    )


    args = parser.parse_args()


    onboard_product(
        set_name=args.set_name.strip(),
        set_slug=args.set_slug.strip(),
        set_code=_clean_text(
            args.set_code
        ),
        series_id=args.series_id,
        release_date=_clean_text(
            args.release_date
        ),
        overview=_clean_text(
            args.overview
        ),
        product_name=(
            args.product_name.strip()
        ),
        product_slug=(
            args.product_slug.strip()
        ),
        image_url=_clean_text(
            args.image_url
        ),
        tcgplayer_id=(
            args.tcgplayer_id
        ),
        tcgcsv_group_id=(
            args.tcgcsv_group_id
        ),
        ebay_query=(
            args.ebay_query
        ),
        keywords=(
            args.keywords
        ),
        game_id=args.game_id,
        language_id=(
            args.language_id
        ),
        product_type_id=(
            args.product_type_id
        ),
        packs_per_product=(
            args.packs_per_product
        ),
        cards_per_pack=(
            args.cards_per_pack
        ),
        msrp=_clean_text(
            args.msrp
        ),
        description=_clean_text(
            args.description
        ),
    )


if __name__ == "__main__":
    main()