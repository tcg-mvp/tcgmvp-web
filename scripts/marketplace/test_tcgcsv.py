from __future__ import annotations

from scripts.marketplace.product_identifiers import (
    get_tcgcsv_group_id,
    get_tcgplayer_id,
)
from scripts.marketplace.providers.tcgcsv import TCGCSVProvider


def main() -> None:
    product_id = 3

    tcgplayer_id = get_tcgplayer_id(product_id)
    group_id = int(get_tcgcsv_group_id(product_id))

    print(f"Product ID: {product_id}")
    print(f"TCGPlayer ID: {tcgplayer_id}")
    print(f"TCGCSV Group ID: {group_id}")
    print("Fetching TCGCSV market price...")

    provider = TCGCSVProvider()

    observation = provider.fetch_market_price(
        product_id=product_id,
        provider_product_id=tcgplayer_id,
        group_id=group_id,
    )

    print("")
    print("TCGCSV provider test successful.")
    print(f"Provider: {observation.provider_name}")
    print(f"Provider Product ID: {observation.provider_product_id}")
    print(f"Market Price: ${observation.market_price}")
    print(f"Currency: {observation.currency_code}")


if __name__ == "__main__":
    main()