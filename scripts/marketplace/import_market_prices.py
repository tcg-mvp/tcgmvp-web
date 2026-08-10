from __future__ import annotations
import os
from pathlib import Path

from dotenv import load_dotenv


from scripts.marketplace.market_metrics import save_market_price
from scripts.marketplace.product_identifiers import get_tcgplayer_id
from scripts.marketplace.product_market_summary import (
    update_product_market_summary,
)
from scripts.marketplace.providers.pokemon_price_tracker import (
    PokemonPriceTrackerProvider,
)
from scripts.marketplace.supabase_client import get_supabase_client

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env.local")

TCGPLAYER_MARKETPLACE_ID = 2


def get_active_products() -> list[dict]:
    supabase = get_supabase_client()

    response = (
        supabase.table("products")
        .select("id,name")
        .eq("active_for_import", True)
        .eq("active", True)
        .order("id")
        .execute()
    )

    return response.data or []


def main() -> None:
    api_key = os.getenv("POKEMON_PRICE_TRACKER_API_KEY")

    if not api_key:
        raise RuntimeError(
            "POKEMON_PRICE_TRACKER_API_KEY environment variable is not set."
        )

    provider = PokemonPriceTrackerProvider(api_key)
    products = get_active_products()

    print("")
    print(f"Active products found: {len(products)}")
    print("")

    successes = 0
    failures = 0

    for product in products:
        product_id = int(product["id"])
        product_name = str(product["name"])

        print(f"Processing: {product_name} (product_id={product_id})")

        try:
            tcgplayer_id = get_tcgplayer_id(product_id)

            print(f"  TCGPlayer ID: {tcgplayer_id}")

            observation = provider.fetch_market_price(
                product_id=product_id,
                provider_product_id=tcgplayer_id,
            )

            saved_metric = save_market_price(
                product_id=product_id,
                marketplace_id=TCGPLAYER_MARKETPLACE_ID,
                market_price=observation.market_price,
            )
            summary = update_product_market_summary(
                product_id=product_id,
                market_price=observation.market_price,
            )
            print(f"  Market price: ${observation.market_price}")
            print(f"  Daily metric ID: {saved_metric['id']}")
            print(f"  Market summary updated for product {summary['product_id']}")
            print("  SUCCESS")
            print("")

            successes += 1

        except Exception as exc:
            print(f"  FAILED: {exc}")
            print("")

            failures += 1

    print("------------------------------")
    print("Import complete.")
    print(f"Successful: {successes}")
    print(f"Failed: {failures}")
    print("------------------------------")


if __name__ == "__main__":
    main()