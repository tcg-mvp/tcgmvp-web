from __future__ import annotations

import json
import os
import sys

from pathlib import Path

from dotenv import load_dotenv
from scripts.marketplace.market_metrics import save_market_price
from scripts.marketplace.product_identifiers import get_tcgplayer_id
from scripts.marketplace.providers.pokemon_price_tracker import (
    PokemonPriceTrackerProvider,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env.local")

def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: python -m scripts.marketplace.test_pokemon_price_tracker "
            "<product_id>"
        )

    product_id = int(sys.argv[1])

    api_key = os.getenv("POKEMON_PRICE_TRACKER_API_KEY")

    if not api_key:
        raise RuntimeError(
            "POKEMON_PRICE_TRACKER_API_KEY environment variable is not set."
        )

    print(f"Looking up TCGPlayer ID for product_id={product_id}...")

    tcgplayer_id = get_tcgplayer_id(product_id)

    print(f"Found TCGPlayer ID: {tcgplayer_id}")
    print("Fetching market price...")

    provider = PokemonPriceTrackerProvider(api_key)

    observation = provider.fetch_market_price(
        product_id=product_id,
        provider_product_id=tcgplayer_id,
    )
    print("Saving market price to Supabase...")

    saved_metric = save_market_price(
        product_id=observation.product_id,
        marketplace_id=2,
        market_price=observation.market_price,
    )

    print("Market price saved successfully.")
    print(f"Daily metric ID: {saved_metric['id']}")

    print("")
    print("Provider pipeline successful.")
    print(f"Product ID: {observation.product_id}")
    print(f"Provider: {observation.provider_name}")
    print(f"Provider Product ID: {observation.provider_product_id}")
    print(f"Market Price: ${observation.market_price}")
    print(f"Currency: {observation.currency_code}")
    print(f"Observed At: {observation.observed_at}")
    print(f"Source Updated At: {observation.source_updated_at}")

    print("")
    print("Normalized observation:")
    print(
        json.dumps(
            observation.to_dict(),
            indent=2,
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()