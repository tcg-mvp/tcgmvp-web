from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Any

from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


TCGPLAYER_MARKETPLACE_ID = 2
EBAY_MARKETPLACE = "ebay"


@dataclass
class ValidationCheck:
    area: str
    name: str
    status: str
    message: str


def _safe_text(
    value: Any,
) -> str | None:
    if value is None:
        return None

    text = str(
        value
    ).strip()

    return (
        text
        if text
        else None
    )


def _add_check(
    checks: list[ValidationCheck],
    *,
    area: str,
    name: str,
    passed: bool,
    success_message: str,
    failure_message: str,
    warning: bool = False,
) -> None:
    if passed:
        status = "PASS"
        message = success_message

    elif warning:
        status = "WARN"
        message = failure_message

    else:
        status = "FAIL"
        message = failure_message

    checks.append(
        ValidationCheck(
            area=area,
            name=name,
            status=status,
            message=message,
        )
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
            "set_id,"
            "language_id,"
            "product_type_id,"
            "image_url,"
            "active,"
            "active_for_import,"
            "release_date,"
            "packs_per_product,"
            "cards_per_pack"
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
            f"No product found for "
            f"product_id={product_id}."
        )

    return rows[0]


def _get_set(
    set_id: int | None,
) -> dict[str, Any] | None:
    if set_id is None:
        return None

    supabase = get_supabase_client()

    response = (
        supabase
        .table("sets")
        .select(
            "id,"
            "name,"
            "slug,"
            "series_id,"
            "language_id,"
            "set_code,"
            "release_date,"
            "overview,"
            "active"
        )
        .eq(
            "id",
            set_id,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        return None

    return rows[0]


def _get_identifiers(
    product_id: int,
) -> dict[str, str]:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("product_identifiers")
        .select(
            "identifier_type,"
            "identifier_value,"
            "marketplace_id"
        )
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace_id",
            TCGPLAYER_MARKETPLACE_ID,
        )
        .execute()
    )

    rows = response.data or []

    identifiers: dict[str, str] = {}

    for row in rows:
        identifier_type = _safe_text(
            row.get(
                "identifier_type"
            )
        )

        identifier_value = _safe_text(
            row.get(
                "identifier_value"
            )
        )

        if (
            identifier_type
            and identifier_value
        ):
            identifiers[
                identifier_type
            ] = identifier_value

    return identifiers


def _get_ebay_config(
    product_id: int,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_marketplace_config"
        )
        .select(
            "product_id,"
            "marketplace,"
            "search_query,"
            "product_keywords,"
            "active"
        )
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

    if not rows:
        return None

    return rows[0]


def _get_market_summary(
    product_id: int,
) -> dict[str, Any] | None:
    supabase = get_supabase_client()

    response = (
        supabase
        .table(
            "product_market_summary"
        )
        .select(
            "product_id,"
            "current_market_price,"
            "active_listings,"
            "lowest_listing_price,"
            "calculated_at"
        )
        .eq(
            "product_id",
            product_id,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        return None

    return rows[0]


def validate_product(
    product_id: int,
) -> dict[str, Any]:
    product = _get_product(
        product_id
    )

    set_row = _get_set(
        product.get(
            "set_id"
        )
    )

    identifiers = _get_identifiers(
        product_id
    )

    ebay_config = _get_ebay_config(
        product_id
    )

    market_summary = (
        _get_market_summary(
            product_id
        )
    )

    checks: list[
        ValidationCheck
    ] = []


    # --------------------------------------------------
    # Core product record
    # --------------------------------------------------

    _add_check(
        checks,
        area="Product",
        name="Product name",
        passed=bool(
            _safe_text(
                product.get(
                    "name"
                )
            )
        ),
        success_message=(
            f"Product name: "
            f"{product.get('name')}"
        ),
        failure_message=(
            "Product name is missing."
        ),
    )


    _add_check(
        checks,
        area="Product",
        name="Product slug",
        passed=bool(
            _safe_text(
                product.get(
                    "slug"
                )
            )
        ),
        success_message=(
            f"Slug: "
            f"{product.get('slug')}"
        ),
        failure_message=(
            "Product slug is missing."
        ),
    )


    _add_check(
        checks,
        area="State",
        name="Active",
        passed=(
            product.get(
                "active"
            )
            is True
        ),
        success_message=(
            "Product is active."
        ),
        failure_message=(
            "Product is still an inactive draft."
        ),
        warning=True,
    )


    _add_check(
        checks,
        area="State",
        name="Active for import",
        passed=(
            product.get(
                "active_for_import"
            )
            is True
        ),
        success_message=(
            "Product is enabled for "
            "market-data import."
        ),
        failure_message=(
            "Product is not yet enabled for market-data import."
        ),
        warning=True,
    )


    _add_check(
        checks,
        area="Product",
        name="Set relation",
        passed=(
            product.get(
                "set_id"
            )
            is not None
        ),
        success_message=(
            f"Set ID: "
            f"{product.get('set_id')}"
        ),
        failure_message=(
            "Product does not have a set_id."
        ),
    )


    _add_check(
        checks,
        area="Product",
        name="Language relation",
        passed=(
            product.get(
                "language_id"
            )
            is not None
        ),
        success_message=(
            f"Language ID: "
            f"{product.get('language_id')}"
        ),
        failure_message=(
            "Product does not have a language_id."
        ),
    )


    _add_check(
        checks,
        area="Product",
        name="Product type relation",
        passed=(
            product.get(
                "product_type_id"
            )
            is not None
        ),
        success_message=(
            f"Product type ID: "
            f"{product.get('product_type_id')}"
        ),
        failure_message=(
            "Product does not have a product_type_id."
        ),
    )


    # --------------------------------------------------
    # Product-page readiness
    # --------------------------------------------------

    _add_check(
        checks,
        area="Page",
        name="Product image",
        passed=bool(
            _safe_text(
                product.get(
                    "image_url"
                )
            )
        ),
        success_message=(
            f"Image: "
            f"{product.get('image_url')}"
        ),
        failure_message=(
            "image_url is missing."
        ),
    )


    _add_check(
        checks,
        area="Page",
        name="Release date",
        passed=(
            product.get(
                "release_date"
            )
            is not None
        ),
        success_message=(
            f"Release date: "
            f"{product.get('release_date')}"
        ),
        failure_message=(
            "Product release_date is missing."
        ),
        warning=True,
    )


    _add_check(
        checks,
        area="Page",
        name="Packs per product",
        passed=(
            product.get(
                "packs_per_product"
            )
            is not None
        ),
        success_message=(
            f"Packs per product: "
            f"{product.get('packs_per_product')}"
        ),
        failure_message=(
            "packs_per_product is missing."
        ),
        warning=True,
    )


    _add_check(
        checks,
        area="Page",
        name="Cards per pack",
        passed=(
            product.get(
                "cards_per_pack"
            )
            is not None
        ),
        success_message=(
            f"Cards per pack: "
            f"{product.get('cards_per_pack')}"
        ),
        failure_message=(
            "cards_per_pack is missing."
        ),
        warning=True,
    )


    # --------------------------------------------------
    # Set readiness
    # --------------------------------------------------

    _add_check(
        checks,
        area="Set",
        name="Set record",
        passed=(
            set_row is not None
        ),
        success_message=(
            f"Set: "
            f"{set_row.get('name')}"
            if set_row
            else "Set found."
        ),
        failure_message=(
            "Referenced set record "
            "could not be found."
        ),
    )


    if set_row is not None:
        _add_check(
            checks,
            area="Set",
            name="Set active",
            passed=(
                set_row.get(
                    "active"
                )
                is True
            ),
            success_message=(
                "Set is active."
            ),
            failure_message=(
                "Set is not active."
            ),
        )


        _add_check(
            checks,
            area="Set",
            name="Set slug",
            passed=bool(
                _safe_text(
                    set_row.get(
                        "slug"
                    )
                )
            ),
            success_message=(
                f"Set slug: "
                f"{set_row.get('slug')}"
            ),
            failure_message=(
                "Set slug is missing."
            ),
        )


        _add_check(
            checks,
            area="Set",
            name="Series relation",
            passed=(
                set_row.get(
                    "series_id"
                )
                is not None
            ),
            success_message=(
                f"Series ID: "
                f"{set_row.get('series_id')}"
            ),
            failure_message=(
                "Set series_id is missing."
            ),
        )


        _add_check(
            checks,
            area="Set",
            name="Set code",
            passed=bool(
                _safe_text(
                    set_row.get(
                        "set_code"
                    )
                )
            ),
            success_message=(
                f"Set code: "
                f"{set_row.get('set_code')}"
            ),
            failure_message=(
                "Set code is missing."
            ),
            warning=True,
        )


        _add_check(
            checks,
            area="Page",
            name="Set overview",
            passed=bool(
                _safe_text(
                    set_row.get(
                        "overview"
                    )
                )
            ),
            success_message=(
                "Set overview is populated."
            ),
            failure_message=(
                "Set overview is missing. "
                "The product page will show "
                "'Product overview is not "
                "available yet.'"
            ),
            warning=True,
        )


    # --------------------------------------------------
    # TCGPlayer / TCGCSV readiness
    # --------------------------------------------------

    tcgplayer_id = (
        identifiers.get(
            "tcgplayer_id"
        )
    )

    tcgcsv_group_id = (
        identifiers.get(
            "tcgcsv_group_id"
        )
    )


    _add_check(
        checks,
        area="TCGCSV",
        name="TCGPlayer ID",
        passed=bool(
            tcgplayer_id
        ),
        success_message=(
            f"TCGPlayer ID: "
            f"{tcgplayer_id}"
        ),
        failure_message=(
            "TCGPlayer identifier is missing."
        ),
    )


    _add_check(
        checks,
        area="TCGCSV",
        name="TCGCSV group ID",
        passed=bool(
            tcgcsv_group_id
        ),
        success_message=(
            f"TCGCSV group ID: "
            f"{tcgcsv_group_id}"
        ),
        failure_message=(
            "TCGCSV group identifier is missing."
        ),
    )


    # --------------------------------------------------
    # eBay / SoldComps readiness
    # --------------------------------------------------

    _add_check(
        checks,
        area="eBay",
        name="Marketplace config",
        passed=(
            ebay_config is not None
        ),
        success_message=(
            "eBay marketplace configuration "
            "exists."
        ),
        failure_message=(
            "No eBay marketplace configuration "
            "exists."
        ),
    )


    if ebay_config is not None:
        _add_check(
            checks,
            area="eBay",
            name="Config active",
            passed=(
                ebay_config.get(
                    "active"
                )
                is True
            ),
            success_message=(
                "eBay configuration is active."
            ),
            failure_message=(
                "eBay configuration is inactive."
            ),
        )


        search_query = _safe_text(
            ebay_config.get(
                "search_query"
            )
        )


        _add_check(
            checks,
            area="eBay",
            name="Search query",
            passed=bool(
                search_query
            ),
            success_message=(
                f"Search query: "
                f"{search_query}"
            ),
            failure_message=(
                "eBay search_query is missing."
            ),
        )


        product_keywords = (
            ebay_config.get(
                "product_keywords"
            )
            or []
        )


        _add_check(
            checks,
            area="eBay",
            name="Product keywords",
            passed=(
                isinstance(
                    product_keywords,
                    list,
                )
                and len(
                    product_keywords
                ) > 0
            ),
            success_message=(
                "Product keywords: "
                + ", ".join(
                    str(
                        keyword
                    )
                    for keyword
                    in product_keywords
                )
            ),
            failure_message=(
                "eBay product_keywords are missing."
            ),
        )


    # --------------------------------------------------
    # Current pipeline state
    # --------------------------------------------------

    _add_check(
        checks,
        area="Pipeline",
        name="Market summary",
        passed=(
            market_summary
            is not None
        ),
        success_message=(
            "product_market_summary exists."
        ),
        failure_message=(
            "product_market_summary does not "
            "exist yet. Run the market pipeline."
        ),
        warning=True,
    )


    if market_summary is not None:
        current_market_price = (
            market_summary.get(
                "current_market_price"
            )
        )


        _add_check(
            checks,
            area="Pipeline",
            name="Current market price",
            passed=(
                current_market_price
                is not None
            ),
            success_message=(
                f"Current market price: "
                f"${current_market_price}"
            ),
            failure_message=(
                "Current market price has not "
                "been populated yet."
            ),
            warning=True,
        )


    failures = [
        check
        for check in checks
        if check.status
        == "FAIL"
    ]

    warnings = [
        check
        for check in checks
        if check.status
        == "WARN"
    ]

    passes = [
        check
        for check in checks
        if check.status
        == "PASS"
    ]


    configuration_areas = {
        "Product",
        "Page",
        "Set",
        "TCGCSV",
        "eBay",
    }

    configuration_blockers = [
        check
        for check in checks
        if (
            check.area in configuration_areas
            and check.status == "FAIL"
        )
    ]

    configuration_ready = (
        len(configuration_blockers) == 0
    )

    current_market_price = (
        market_summary.get("current_market_price")
        if market_summary is not None
        else None
    )

    market_data_ready = (
        market_summary is not None
        and current_market_price is not None
    )

    pipeline_ready = (
        configuration_ready
        and product.get("active_for_import") is True
    )

    page_warning_areas = {
        "Page",
        "Set",
    }

    page_warnings = [
        check
        for check in warnings
        if check.area in page_warning_areas
    ]

    page_ready = (
        configuration_ready
        and market_data_ready
        and product.get("active") is True
        and len(page_warnings) == 0
    )


    return {
        "product":
            product,

        "checks":
            checks,

        "passes":
            len(
                passes
            ),

        "warnings":
            len(
                warnings
            ),

        "failures":
            len(
                failures
            ),

        "configuration_ready":
            configuration_ready,

        "market_data_ready":
            market_data_ready,

        "pipeline_ready":
            pipeline_ready,

        "page_ready":
            page_ready,
    }


def _print_validation(
    result: dict[str, Any],
) -> None:
    product = result[
        "product"
    ]

    checks: list[
        ValidationCheck
    ] = result[
        "checks"
    ]


    print("=" * 78)

    print(
        "TCGMVP PRODUCT ONBOARDING VALIDATION"
    )

    print("=" * 78)

    print(
        f"Product: "
        f"{str(product.get('name')).strip()}"
    )

    print(
        f"Product ID: "
        f"{product.get('id')}"
    )

    print(
        f"Slug: "
        f"{product.get('slug')}"
    )

    print("")


    current_area: str | None = (
        None
    )


    for check in checks:
        if check.area != current_area:
            current_area = (
                check.area
            )

            print(
                f"[{current_area}]"
            )

        icon = {
            "PASS": "PASS",
            "WARN": "WARN",
            "FAIL": "FAIL",
        }[
            check.status
        ]

        print(
            f"  {icon:<4} "
            f"{check.name}: "
            f"{check.message}"
        )

    print("")

    print("-" * 78)

    print(
        f"Passed:   "
        f"{result['passes']}"
    )

    print(
        f"Warnings: "
        f"{result['warnings']}"
    )

    print(
        f"Failures: "
        f"{result['failures']}"
    )

    print("")

    print(
        "Configuration Ready: "
        + (
            "YES"
            if result[
                "configuration_ready"
            ]
            else "NO"
        )
    )

    print(
        "Market Data Ready: "
        + (
            "YES"
            if result[
                "market_data_ready"
            ]
            else "NO"
        )
    )

    print(
        "Pipeline Ready: "
        + (
            "YES"
            if result[
                "pipeline_ready"
            ]
            else "NO"
        )
    )

    print(
        "Product Page Ready: "
        + (
            "YES"
            if result[
                "page_ready"
            ]
            else "NO"
        )
    )

    print("=" * 78)


def _get_active_import_product_ids(
) -> list[int]:
    supabase = get_supabase_client()

    response = (
        supabase
        .table("products")
        .select(
            "id"
        )
        .eq(
            "active",
            True,
        )
        .eq(
            "active_for_import",
            True,
        )
        .order(
            "id"
        )
        .execute()
    )

    return [
        int(
            row["id"]
        )
        for row
        in (
            response.data
            or []
        )
    ]


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Validate TCGMVP product "
            "onboarding configuration."
        )
    )

    parser.add_argument(
        "--product-id",
        type=int,
        help=(
            "Validate one TCGMVP product."
        ),
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help=(
            "Validate all active import products."
        ),
    )

    args = parser.parse_args()


    if (
        args.product_id
        is None
        and not args.all
    ):
        parser.error(
            "Provide --product-id ID "
            "or --all."
        )


    if (
        args.product_id
        is not None
        and args.all
    ):
        parser.error(
            "Use either --product-id "
            "or --all, not both."
        )


    if args.product_id is not None:
        result = validate_product(
            args.product_id
        )

        _print_validation(
            result
        )

        return


    product_ids = (
        _get_active_import_product_ids()
    )

    products_ready = 0
    products_not_ready = 0


    for index, product_id in enumerate(
        product_ids
    ):
        result = validate_product(
            product_id
        )

        _print_validation(
            result
        )

        if result[
            "pipeline_ready"
        ]:
            products_ready += 1
        else:
            products_not_ready += 1

        if (
            index
            < len(
                product_ids
            ) - 1
        ):
            print("")


    print("")

    print("=" * 78)

    print(
        "TCGMVP CATALOG VALIDATION SUMMARY"
    )

    print("=" * 78)

    print(
        f"Products checked: "
        f"{len(product_ids)}"
    )

    print(
        f"Pipeline ready: "
        f"{products_ready}"
    )

    print(
        f"Not ready: "
        f"{products_not_ready}"
    )

    print("=" * 78)


if __name__ == "__main__":
    main()