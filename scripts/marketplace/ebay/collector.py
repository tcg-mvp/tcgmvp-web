from __future__ import annotations

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
        -> Browse API
        -> filtering / normalization
        -> market_listings upsert

    Returns a summary of the collection run.
    """
    products = get_ebay_import_products()

    summary = {
        "products_attempted": 0,
        "products_successful": 0,
        "products_failed": 0,
        "listings_processed": 0,
        "results": [],
    }

    for product in products:
        product_id = product["tcgmvp_product_id"]
        product_name = product["name"]

        summary["products_attempted"] += 1

        print("=" * 70)
        print(f"Collecting: {product_name}")
        print(f"Product ID: {product_id}")
        print(f"Query: {product['query']}")

        try:
            listings = (
                fetch_active_booster_box_listings(
                    query=product["query"],
                    product_keywords=(
                        product["product_keywords"]
                    ),
                    limit=limit_per_product,
                )
            )

            print(
                f"Valid listings found: "
                f"{len(listings)}"
            )

            processed = upsert_ebay_listings(
                product_id=product_id,
                listings=listings,
            )

            print(
                f"Listings processed: {processed}"
            )
            statistics = calculate_ebay_listing_statistics(
                product_id=product_id,
                freshness_hours=24,
            )

            save_ebay_listing_metrics(
                product_id=product_id,
                active_listing_count=(
                    statistics["active_listing_count"]
                ),
                unique_seller_count=(
                    statistics["unique_seller_count"]
                ),
                known_shipping_count=(
                    statistics["known_shipping_count"]
                ),
                unknown_shipping_count=(
                    statistics["unknown_shipping_count"]
                ),
                best_offer_count=(
                    statistics["best_offer_count"]
                ),
                lowest_listing_price=(
                    statistics["min_listing_price"]
                ),
                median_listing_price=(
                    statistics["median_listing_price"]
                ),
                highest_listing_price=(
                    statistics["max_listing_price"]
                ),
                delivered_price_sample_size=(
                    statistics["delivered_price_sample_size"]
                ),
                lowest_delivered_price=(
                    statistics["min_delivered_price"]
                ),
                median_delivered_price=(
                    statistics["median_delivered_price"]
                ),
                highest_delivered_price=(
                    statistics["max_delivered_price"]
                ),
            )

            print("Daily eBay metrics saved.")
            summary["products_successful"] += 1
            summary["listings_processed"] += (
                processed
            )

            summary["results"].append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "success",
                    "listings_processed": processed,
                }
            )

        except Exception as exc:
            summary["products_failed"] += 1

            summary["results"].append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "failed",
                    "error": str(exc),
                }
            )

            print(
                f"ERROR collecting "
                f"{product_name}: {exc}"
            )

        print()

    return summary