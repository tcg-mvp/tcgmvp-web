from __future__ import annotations

import argparse

from scripts.marketplace.soldcomps.collector import (
    collect_soldcomps_sales,
)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Collect SoldComps sales "
            "for TCGMVP products."
        )
    )

    parser.add_argument(
        "--product-id",
        type=int,
        default=None,
        help=(
            "Optional TCGMVP product ID. "
            "When provided, only that "
            "product is collected."
        ),
    )

    args = parser.parse_args()

    print(
        "Starting SoldComps sales collection...\n"
    )

    summary = collect_soldcomps_sales(
        count_per_product=50,
        product_id=args.product_id,
    )

    print("=" * 70)
    print(
        "SoldComps collection complete"
    )
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
        "Sales processed: "
        f"{summary['sales_processed']}"
    )

    if summary["products_failed"]:
        print("\nFailures:")

        for result in summary[
            "results"
        ]:
            if (
                result["status"]
                == "failed"
            ):
                print(
                    f"- "
                    f"{result['name']}: "
                    f"{result['error']}"
                )


if __name__ == "__main__":
    main()