from __future__ import annotations

from scripts.marketplace.ebay.products import (
    get_ebay_import_products,
)
from scripts.marketplace.market_metrics import (
    save_ebay_sold_metrics,
)
from scripts.marketplace.soldcomps.sold_statistics import (
    calculate_verified_sold_statistics,
)


def update_sold_metrics() -> dict:
    products = get_ebay_import_products()

    successes = 0
    failures = 0

    results: list[dict] = []

    for product in products:
        product_id = int(
            product["tcgmvp_product_id"]
        )

        product_name = product["name"]

        print("=" * 70)
        print(
            f"Updating sold metrics: "
            f"{product_name}"
        )
        print("=" * 70)

        try:
            statistics = (
                calculate_verified_sold_statistics(
                    product_id=product_id,
                    window_days=30,
                )
            )

            save_ebay_sold_metrics(
                product_id=product_id,
                sales_count=statistics[
                    "sales_count"
                ],
                sales_volume=statistics[
                    "sales_volume"
                ],
                average_sale_price=statistics[
                    "average_sale_price"
                ],
                median_sale_price=statistics[
                    "median_sale_price"
                ],
                low_sale_price=statistics[
                    "low_sale_price"
                ],
                high_sale_price=statistics[
                    "high_sale_price"
                ],
            )

            print(
                "  Verified sales: "
                f"{statistics['sales_count']}"
            )

            print(
                "  Median sale: "
                f"{statistics['median_sale_price']}"
            )

            print(
                "  Average sale: "
                f"{statistics['average_sale_price']}"
            )

            print(
                "  Daily sold metrics saved."
            )

            print("  SUCCESS")
            print("")

            successes += 1

            results.append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "success",
                    "sales_count": statistics[
                        "sales_count"
                    ],
                }
            )

        except Exception as exc:
            failures += 1

            print(
                f"  FAILED: {exc}"
            )
            print("")

            results.append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "failed",
                    "error": str(exc),
                }
            )

    return {
        "products_attempted": len(products),
        "products_successful": successes,
        "products_failed": failures,
        "results": results,
    }


def main() -> None:
    print(
        "Starting verified sold-metrics update...\n"
    )

    summary = update_sold_metrics()

    print("=" * 70)
    print("Sold-metrics update complete")
    print("=" * 70)

    print(
        "Products attempted: "
        f"{summary['products_attempted']}"
    )

    print(
        "Products successful: "
        f"{summary['products_successful']}"
    )

    print(
        "Products failed: "
        f"{summary['products_failed']}"
    )

    if summary["products_failed"]:
        print("\nFailures:")

        for result in summary["results"]:
            if result["status"] == "failed":
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )


if __name__ == "__main__":
    main()