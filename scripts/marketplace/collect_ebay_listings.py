from __future__ import annotations

from scripts.marketplace.ebay.collector import (
    collect_ebay_active_listings,
)


def main() -> None:
    print(
        "Starting eBay active listing collection...\n"
    )

    summary = collect_ebay_active_listings(
        limit_per_product=50,
    )

    print("=" * 70)
    print("eBay collection complete")
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

    print(
        "Listings processed: "
        f"{summary['listings_processed']}"
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