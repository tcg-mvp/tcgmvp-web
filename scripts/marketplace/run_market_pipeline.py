from __future__ import annotations

import argparse
import sys
import time
from datetime import UTC, datetime
from typing import Any

from scripts.marketplace.ebay.collector import (
    collect_ebay_active_listings,
)
from scripts.marketplace.historical_products import (
    get_historical_import_products,
)
from scripts.marketplace.market_summary_calculator import (
    update_calculated_market_summary,
)
from scripts.marketplace.soldcomps.collector import (
    collect_soldcomps_sales,
)
from scripts.marketplace.update_sold_metrics import (
    update_sold_metrics,
)
from scripts.marketplace.update_tcgcsv_prices import (
    update_tcgcsv_prices,
)
from scripts.marketplace.pipeline_logging import (
    finish_pipeline_run,
    start_pipeline_run,
)

def _print_header(
    title: str,
) -> None:
    print("")
    print("=" * 70)
    print(title)
    print("=" * 70)


def _format_duration(
    seconds: float,
) -> str:
    if seconds < 60:
        return f"{seconds:.1f}s"

    minutes = int(seconds // 60)
    remaining_seconds = seconds % 60

    return (
        f"{minutes}m "
        f"{remaining_seconds:.1f}s"
    )


def run_tcgcsv_update() -> dict[str, Any]:
    _print_header(
        "STEP 1 — TCGCSV market prices"
    )

    started_at = time.perf_counter()

    summary = update_tcgcsv_prices()

    duration = (
        time.perf_counter()
        - started_at
    )

    print("")
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
        "Duration: "
        f"{_format_duration(duration)}"
    )

    if summary["products_failed"]:
        print("")
        print("Failures:")

        for result in summary["results"]:
            if result["status"] == "failed":
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )

    return {
        "step": "tcgcsv",
        "success": (
            summary["products_failed"] == 0
        ),
        "duration_seconds": duration,
        "summary": summary,
    }


def run_ebay_collection() -> dict[str, Any]:
    _print_header(
        "STEP 2 — eBay active listings"
    )

    started_at = time.perf_counter()

    summary = collect_ebay_active_listings(
        limit_per_product=50,
    )

    duration = (
        time.perf_counter()
        - started_at
    )

    print("")
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

    print(
        "Duration: "
        f"{_format_duration(duration)}"
    )

    if summary["products_failed"]:
        print("")
        print("Failures:")

        for result in summary["results"]:
            if result["status"] == "failed":
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )

    return {
        "step": "ebay",
        "success": (
            summary["products_failed"] == 0
        ),
        "duration_seconds": duration,
        "summary": summary,
    }


def run_soldcomps_collection() -> dict[str, Any]:
    _print_header(
        "STEP 3 — SoldComps completed sales"
    )

    started_at = time.perf_counter()

    summary = collect_soldcomps_sales(
        count_per_product=50,
    )

    duration = (
        time.perf_counter()
        - started_at
    )

    print("")
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

    print(
        "Duration: "
        f"{_format_duration(duration)}"
    )

    if summary["products_failed"]:
        print("")
        print("Failures:")

        for result in summary["results"]:
            if result["status"] == "failed":
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )

    return {
        "step": "soldcomps",
        "success": (
            summary["products_failed"] == 0
        ),
        "duration_seconds": duration,
        "summary": summary,
    }


def run_sold_metrics_update() -> dict[str, Any]:
    _print_header(
        "STEP 4 — Verified 30-day sold metrics"
    )

    started_at = time.perf_counter()

    summary = update_sold_metrics()

    duration = (
        time.perf_counter()
        - started_at
    )

    print("")
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
        "Duration: "
        f"{_format_duration(duration)}"
    )

    if summary["products_failed"]:
        print("")
        print("Failures:")

        for result in summary["results"]:
            if result["status"] == "failed":
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )

    return {
        "step": "sold_metrics",
        "success": (
            summary["products_failed"] == 0
        ),
        "duration_seconds": duration,
        "summary": summary,
    }


def run_market_summary_updates() -> dict[str, Any]:
    _print_header(
        "STEP 5 — Product market summaries"
    )

    started_at = time.perf_counter()

    products = get_historical_import_products()

    successes = 0
    failures = 0

    results: list[dict[str, Any]] = []

    print(
        f"Products found: {len(products)}"
    )
    print("")

    for product in products:
        product_id = int(
            product["tcgmvp_product_id"]
        )

        product_name = product["name"]

        print(
            f"Updating {product_name} "
            f"(product_id={product_id})"
        )

        try:
            summary = (
                update_calculated_market_summary(
                    product_id=product_id,
                )
            )

            print(
                "  Current: "
                f"${summary.get('current_market_price')}"
            )

            print(
                "  7D: "
                f"{summary.get('change_7d_percent')}%"
            )

            print(
                "  30D: "
                f"{summary.get('change_30d_percent')}%"
            )

            print(
                "  90D: "
                f"{summary.get('change_90d_percent')}%"
            )

            print(
                "  Active listings: "
                f"{summary.get('active_listings')}"
            )

            print(
                "  Lowest listing: "
                f"${summary.get('lowest_listing_price')}"
            )

            print("  SUCCESS")
            print("")

            successes += 1

            results.append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "success",
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

    duration = (
        time.perf_counter()
        - started_at
    )

    print(
        "Successful: "
        f"{successes}"
    )

    print(
        "Failed: "
        f"{failures}"
    )

    print(
        "Duration: "
        f"{_format_duration(duration)}"
    )

    return {
        "step": "market_summaries",
        "success": failures == 0,
        "duration_seconds": duration,
        "summary": {
            "products_attempted": len(products),
            "products_successful": successes,
            "products_failed": failures,
            "results": results,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Run the TCGMVP live "
            "market-data pipeline."
        )
    )

    parser.add_argument(
        "--skip-tcgcsv",
        action="store_true",
        help=(
            "Skip TCGCSV current market-"
            "price refresh."
        ),
    )

    parser.add_argument(
        "--skip-ebay",
        action="store_true",
        help=(
            "Skip eBay active-listing "
            "collection."
        ),
    )

    parser.add_argument(
        "--skip-soldcomps",
        action="store_true",
        help=(
            "Skip SoldComps completed-"
            "sales collection."
        ),
    )

    parser.add_argument(
        "--skip-sold-metrics",
        action="store_true",
        help=(
            "Skip verified 30-day "
            "sold-metrics recalculation."
        ),
    )

    parser.add_argument(
        "--skip-summaries",
        action="store_true",
        help=(
            "Skip product market-summary "
            "recalculation."
        ),
    )

    args = parser.parse_args()
    run_id = start_pipeline_run(
        pipeline_name="market_pipeline"
    )
    pipeline_started_at = (
        time.perf_counter()
    )

    run_timestamp = (
        datetime.now(UTC).isoformat()
    )

    _print_header(
        "TCGMVP MARKET PIPELINE"
    )

    print(
        f"Started: {run_timestamp}"
    )

    results: list[dict[str, Any]] = []

    fatal_error: Exception | None = None

    try:
        if not args.skip_tcgcsv:
            try:
                results.append(
                    run_tcgcsv_update()
                )

            except Exception as exc:
                print("")
                print(
                    "TCGCSV update "
                    "failed unexpectedly:"
                )
                print(exc)

                results.append(
                    {
                        "step": "tcgcsv",
                        "success": False,
                        "error": str(exc),
                    }
                )

        if not args.skip_ebay:
            try:
                results.append(
                    run_ebay_collection()
                )

            except Exception as exc:
                print("")
                print(
                    "eBay collection "
                    "failed unexpectedly:"
                )
                print(exc)

                results.append(
                    {
                        "step": "ebay",
                        "success": False,
                        "error": str(exc),
                    }
                )

        if not args.skip_soldcomps:
            try:
                results.append(
                    run_soldcomps_collection()
                )

            except Exception as exc:
                print("")
                print(
                    "SoldComps collection "
                    "failed unexpectedly:"
                )
                print(exc)

                results.append(
                    {
                        "step": "soldcomps",
                        "success": False,
                        "error": str(exc),
                    }
                )

        if not args.skip_sold_metrics:
            try:
                results.append(
                    run_sold_metrics_update()
                )

            except Exception as exc:
                print("")
                print(
                    "Sold-metrics update "
                    "failed unexpectedly:"
                )
                print(exc)

                results.append(
                    {
                        "step": "sold_metrics",
                        "success": False,
                        "error": str(exc),
                    }
                )

        if not args.skip_summaries:
            try:
                results.append(
                    run_market_summary_updates()
                )

            except Exception as exc:
                print("")
                print(
                    "Market-summary update "
                    "failed unexpectedly:"
                )
                print(exc)

                results.append(
                    {
                        "step": "market_summaries",
                        "success": False,
                        "error": str(exc),
                    }
                )

    except Exception as exc:
        fatal_error = exc

    total_duration = (
        time.perf_counter()
        - pipeline_started_at
    )

    _print_header(
        "TCGMVP PIPELINE SUMMARY"
    )

    for result in results:
        status = (
            "SUCCESS"
            if result.get("success")
            else "FAILED"
        )

        print(
            f"{result['step']}: "
            f"{status}"
        )

    successful_steps = sum(
        1
        for result in results
        if result.get("success")
    )

    failed_steps = sum(
        1
        for result in results
        if not result.get("success")
    )

    print("")

    print(
        f"Steps successful: "
        f"{successful_steps}"
    )

    print(
        f"Steps failed: "
        f"{failed_steps}"
    )

    print(
        "Total duration: "
        f"{_format_duration(total_duration)}"
    )

    print(
        "Completed: "
        f"{datetime.now(UTC).isoformat()}"
    )
    pipeline_status = (
        "success"
        if (
            failed_steps == 0
            and fatal_error is None
        )
        else "failed"
    )

    finish_pipeline_run(
        run_id=run_id,
        status=pipeline_status,
        steps_successful=successful_steps,
        steps_failed=failed_steps,
        duration_seconds=total_duration,
        details={
            "results": results,
            "skip_tcgcsv": args.skip_tcgcsv,
            "skip_ebay": args.skip_ebay,
            "skip_soldcomps": args.skip_soldcomps,
            "skip_sold_metrics": (
                args.skip_sold_metrics
            ),
            "skip_summaries": (
                args.skip_summaries
            ),
        },
    )
    if fatal_error is not None:
        print("")
        print(
            "Fatal pipeline error:"
        )
        print(fatal_error)

        sys.exit(1)

    if failed_steps > 0:
        print("")
        print(
            "Pipeline completed with "
            "one or more failed steps."
        )

        sys.exit(1)

    print("")
    print(
        "Pipeline completed "
        "successfully."
    )


if __name__ == "__main__":
    main()