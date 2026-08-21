from __future__ import annotations

from decimal import (
    Decimal,
    InvalidOperation,
)
from typing import Any

from scripts.marketplace.ebay.listing_importer import (
    upsert_ebay_listings,
)
from scripts.marketplace.ebay.listings import (
    fetch_active_booster_box_listings,
)
from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)
from scripts.marketplace.ebay.listing_statistics import (
    calculate_ebay_listing_statistics,
)
from scripts.marketplace.market_metrics import (
    save_ebay_listing_metrics,
)
from scripts.marketplace.supabase_client import (
    get_supabase_client,
)


MIN_REFERENCE_PRICE_RATIO = Decimal(
    "0.50"
)

MAX_REFERENCE_PRICE_RATIO = Decimal(
    "2.00"
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


def _get_reference_price(
    *,
    product_id: int,
) -> Decimal | None:
    """
    Read the current reference price from
    product_market_summary.

    This remains TCGPlayer/reference-price
    evidence and is used only as a broad
    active-listing sanity guardrail.
    """
    supabase = (
        get_supabase_client()
    )

    response = (
        supabase
        .table(
            "product_market_summary"
        )
        .select(
            "current_market_price"
        )
        .eq(
            "product_id",
            product_id,
        )
        .limit(1)
        .execute()
    )

    rows = (
        response.data
        or []
    )

    if not rows:
        return None

    return _to_decimal(
        rows[0].get(
            "current_market_price"
        )
    )


def _filter_listing_prices(
    *,
    listings: list[dict],
    reference_price: Decimal | None,
) -> list[dict]:
    """
    Apply a deliberately broad price sanity
    check to active listings.

    This is not a valuation model.

    Its purpose is only to reject listings
    whose prices are implausible for the
    tracked product despite otherwise
    matching the title rules.

    If no reference price exists, listings
    are preserved rather than discarded.
    """
    if (
        reference_price is None
        or reference_price <= 0
    ):
        return listings

    minimum_price = (
        reference_price
        * MIN_REFERENCE_PRICE_RATIO
    )

    maximum_price = (
        reference_price
        * MAX_REFERENCE_PRICE_RATIO
    )

    filtered: list[dict] = []

    for listing in listings:
        listing_price = (
            _to_decimal(
                listing.get(
                    "listing_price"
                )
            )
        )

        if (
            listing_price is None
            or listing_price <= 0
        ):
            continue

        if (
            listing_price
            < minimum_price
            or listing_price
            > maximum_price
        ):
            print(
                "  Excluding suspicious "
                "listing price: "
                f"${listing_price} | "
                f"{listing.get('title')}"
            )

            continue

        filtered.append(
            listing
        )

    return filtered


def collect_ebay_active_listings(
    *,
    limit_per_product: int = 50,
) -> dict:
    """
    Collect active eBay listings for all
    configured TCGMVP products.

    Flow:
        Supabase products
        -> eBay product configuration
        -> Browse API
        -> title / product filtering
        -> reference-price sanity filtering
        -> market_listings upsert
        -> daily listing statistics

    Returns a summary of the collection run.
    """
    products = (
        get_ebay_import_products()
    )

    summary = {
        "products_attempted": 0,
        "products_successful": 0,
        "products_failed": 0,
        "listings_processed": 0,
        "results": [],
    }

    for product in products:
        product_id = int(
            product[
                "tcgmvp_product_id"
            ]
        )

        product_name = (
            product["name"]
        )

        summary[
            "products_attempted"
        ] += 1

        print("=" * 70)
        print(
            f"Collecting: "
            f"{product_name}"
        )
        print(
            f"Product ID: "
            f"{product_id}"
        )
        print(
            f"Query: "
            f"{product['query']}"
        )

        try:
            reference_price = (
                _get_reference_price(
                    product_id=product_id,
                )
            )

            if (
                reference_price
                is not None
            ):
                print(
                    "Reference price: "
                    f"${reference_price}"
                )

            listings = (
                fetch_active_booster_box_listings(
                    query=product[
                        "query"
                    ],
                    product_keywords=(
                        product[
                            "product_keywords"
                        ]
                    ),
                    limit=limit_per_product,
                )
            )

            raw_valid_count = (
                len(listings)
            )

            listings = (
                _filter_listing_prices(
                    listings=listings,
                    reference_price=(
                        reference_price
                    ),
                )
            )

            excluded_by_price = (
                raw_valid_count
                - len(listings)
            )

            print(
                "Title-valid listings: "
                f"{raw_valid_count}"
            )

            print(
                "Price-sanity exclusions: "
                f"{excluded_by_price}"
            )

            print(
                "Valid listings found: "
                f"{len(listings)}"
            )

            processed = (
                upsert_ebay_listings(
                    product_id=(
                        product_id
                    ),
                    listings=listings,
                )
            )

            print(
                "Listings processed: "
                f"{processed}"
            )

            statistics = (
                calculate_ebay_listing_statistics(
                    product_id=(
                        product_id
                    ),
                    freshness_hours=24,
                )
            )

            save_ebay_listing_metrics(
                product_id=product_id,

                active_listing_count=(
                    statistics[
                        "active_listing_count"
                    ]
                ),

                unique_seller_count=(
                    statistics[
                        "unique_seller_count"
                    ]
                ),

                known_shipping_count=(
                    statistics[
                        "known_shipping_count"
                    ]
                ),

                unknown_shipping_count=(
                    statistics[
                        "unknown_shipping_count"
                    ]
                ),

                best_offer_count=(
                    statistics[
                        "best_offer_count"
                    ]
                ),

                lowest_listing_price=(
                    statistics[
                        "min_listing_price"
                    ]
                ),

                median_listing_price=(
                    statistics[
                        "median_listing_price"
                    ]
                ),

                highest_listing_price=(
                    statistics[
                        "max_listing_price"
                    ]
                ),

                delivered_price_sample_size=(
                    statistics[
                        "delivered_price_sample_size"
                    ]
                ),

                lowest_delivered_price=(
                    statistics[
                        "min_delivered_price"
                    ]
                ),

                median_delivered_price=(
                    statistics[
                        "median_delivered_price"
                    ]
                ),

                highest_delivered_price=(
                    statistics[
                        "max_delivered_price"
                    ]
                ),
            )

            print(
                "Daily eBay metrics saved."
            )

            summary[
                "products_successful"
            ] += 1

            summary[
                "listings_processed"
            ] += processed

            summary["results"].append(
                {
                    "product_id":
                        product_id,

                    "name":
                        product_name,

                    "status":
                        "success",

                    "listings_processed":
                        processed,

                    "price_exclusions":
                        excluded_by_price,
                }
            )

        except Exception as exc:
            summary[
                "products_failed"
            ] += 1

            summary[
                "results"
            ].append(
                {
                    "product_id":
                        product_id,

                    "name":
                        product_name,

                    "status":
                        "failed",

                    "error":
                        str(exc),
                }
            )

            print(
                f"ERROR collecting "
                f"{product_name}: "
                f"{exc}"
            )

        print()

    return summary