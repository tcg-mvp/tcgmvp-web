from __future__ import annotations

from scripts.marketplace.historical_products import (
    get_historical_import_products,
)
from scripts.marketplace.market_metrics import (
    save_market_price,
)
from scripts.marketplace.product_market_summary import (
    update_product_market_summary,
)
from scripts.marketplace.providers.tcgcsv import (
    TCGCSVProvider,
)


TCGPLAYER_MARKETPLACE_ID = 2


def update_tcgcsv_prices() -> dict:
    provider = TCGCSVProvider()

    products = (
        get_historical_import_products()
    )

    successes = 0
    failures = 0

    results: list[dict] = []

    for product in products:
        product_id = int(
            product["tcgmvp_product_id"]
        )

        product_name = str(
            product["name"]
        )

        tcgplayer_id = str(
            product["tcgplayer_id"]
        )

        group_id = int(
            product["group_id"]
        )

        print("=" * 70)
        print(
            f"Updating TCGCSV price: "
            f"{product_name}"
        )
        print("=" * 70)

        try:
            observation = (
                provider.fetch_market_price(
                    product_id=product_id,
                    provider_product_id=tcgplayer_id,
                    group_id=group_id,
                )
            )

            saved_metric = save_market_price(
                product_id=product_id,
                marketplace_id=(
                    TCGPLAYER_MARKETPLACE_ID
                ),
                market_price=(
                    observation.market_price
                ),
            )

            summary = (
                update_product_market_summary(
                    product_id=product_id,
                    market_price=(
                        observation.market_price
                    ),
                )
            )

            print(
                "  TCGPlayer ID: "
                f"{tcgplayer_id}"
            )

            print(
                "  Group ID: "
                f"{group_id}"
            )

            print(
                "  Market price: "
                f"${observation.market_price}"
            )

            print(
                "  Daily metric ID: "
                f"{saved_metric['id']}"
            )

            print(
                "  Market summary updated "
                f"for product "
                f"{summary['product_id']}"
            )

            print("  SUCCESS")
            print("")

            successes += 1

            results.append(
                {
                    "product_id": product_id,
                    "name": product_name,
                    "status": "success",
                    "market_price": str(
                        observation.market_price
                    ),
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
        "Starting TCGCSV market-price refresh...\n"
    )

    summary = update_tcgcsv_prices()

    print("=" * 70)
    print(
        "TCGCSV market-price refresh complete"
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

    if summary["products_failed"]:
        print("\nFailures:")

        for result in summary["results"]:
            if (
                result["status"]
                == "failed"
            ):
                print(
                    f"- {result['name']}: "
                    f"{result['error']}"
                )


if __name__ == "__main__":
    main()