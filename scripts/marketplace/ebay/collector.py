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


EBAY_MARKETPLACE_ID = 1


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
    Read the canonical current market price from
    product_market_summary.

    This is currently TCGPlayer/TCGCSV-derived
    evidence.
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


def _get_verified_median_sale_price(
    *,
    product_id: int,
) -> Decimal | None:
    """
    Return the most recent verified eBay median
    sale price available for the product.

    Sold metrics are stored in daily_market_metrics
    under the eBay marketplace.

    We intentionally use the latest row containing
    a median_sale_price rather than requiring today's
    row to contain sold evidence.
    """
    supabase = (
        get_supabase_client()
    )

    response = (
        supabase
        .table(
            "daily_market_metrics"
        )
        .select(
            "metric_date,"
            "median_sale_price,"
            "sales_count"
        )
        .eq(
            "product_id",
            product_id,
        )
        .eq(
            "marketplace_id",
            EBAY_MARKETPLACE_ID,
        )
        .not_.is_(
            "median_sale_price",
            "null",
        )
        .order(
            "metric_date",
            desc=True,
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

    sales_count = (
        rows[0].get(
            "sales_count"
        )
    )

    if (
        sales_count is None
        or int(sales_count) <= 0
    ):
        return None

    return _to_decimal(
        rows[0].get(
            "median_sale_price"
        )
    )


def collect_ebay_active_listings(
    *,
    limit_per_product: int = 50,
) -> dict:
    """
    Collect active eBay listings for all configured
    TCGMVP products.

    Flow:
        Supabase products
        -> eBay product configuration
        -> TCGCSV reference price
        -> verified eBay sold median
        -> Browse API
        -> title / product validation
        -> dual-anchor price sanity filtering
        -> market_listings upsert
        -> daily listing statistics

    Price sanity filtering itself lives in
    ebay/listings.py so there is one authoritative
    filtering implementation.

    A failure for one product does not stop the
    remaining products.
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

            verified_median_sale_price = (
                _get_verified_median_sale_price(
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

            else:
                print(
                    "Reference price: unavailable"
                )

            if (
                verified_median_sale_price
                is not None
            ):
                print(
                    "Verified sold median: "
                    f"${verified_median_sale_price}"
                )

            else:
                print(
                    "Verified sold median: unavailable"
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
                    reference_price=(
                        reference_price
                    ),
                    verified_median_sale_price=(
                        verified_median_sale_price
                    ),
                )
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

            summary[
                "results"
            ].append(
                {
                    "product_id":
                        product_id,

                    "name":
                        product_name,

                    "status":
                        "success",

                    "reference_price":
                        (
                            str(
                                reference_price
                            )
                            if reference_price
                            is not None
                            else None
                        ),

                    "verified_median_sale_price":
                        (
                            str(
                                verified_median_sale_price
                            )
                            if verified_median_sale_price
                            is not None
                            else None
                        ),

                    "listings_processed":
                        processed,
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