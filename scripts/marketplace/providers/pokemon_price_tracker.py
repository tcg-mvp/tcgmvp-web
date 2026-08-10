from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from scripts.marketplace.models.market_price import MarketPriceObservation
from scripts.marketplace.providers.base import MarketPriceProvider


class PokemonPriceTrackerProvider(MarketPriceProvider):
    BASE_URL = "https://www.pokemonpricetracker.com/api/v2/sealed-products"

    def __init__(self, api_key: str) -> None:
        if not api_key.strip():
            raise ValueError("Pokémon Price Tracker API key is required.")

        self.api_key = api_key.strip()

    @property
    def provider_name(self) -> str:
        return "pokemon_price_tracker"

    def fetch_market_price(
        self,
        *,
        product_id: int,
        provider_product_id: str,
    ) -> MarketPriceObservation:
        query = urlencode(
            {
                "language": "english",
                "tcgPlayerId": provider_product_id,
                "includeHistory": "false",
                "fetchAllInSet": "false",
                "limit": 1,
                "offset": 0,
            }
        )

        request = Request(
            f"{self.BASE_URL}?{query}",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
            },
            method="GET",
        )

        try:
            with urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))

        except HTTPError as exc:
            raise RuntimeError(
                f"Pokémon Price Tracker returned HTTP {exc.code}."
            ) from exc

        except URLError as exc:
            raise RuntimeError(
                "Could not connect to Pokémon Price Tracker."
            ) from exc

        data = payload.get("data")

        if not isinstance(data, list) or len(data) == 0:
            raise LookupError(
                "Pokémon Price Tracker returned no matching sealed product "
                f"for provider product ID {provider_product_id}."
            )

        product = data[0]

        returned_product_id = str(product.get("tcgPlayerId", ""))

        if returned_product_id != str(provider_product_id):
            raise ValueError(
                "Pokémon Price Tracker returned an unexpected product. "
                f"Requested {provider_product_id}, "
                f"received {returned_product_id}."
            )

        price = product.get("unopenedPrice")

        if price is None:
            raise ValueError(
                "Pokémon Price Tracker returned the product without "
                "an unopenedPrice."
            )

        return MarketPriceObservation(
            product_id=product_id,
            provider_name=self.provider_name,
            provider_product_id=returned_product_id,
            market_price=Decimal(str(price)),
            currency_code="USD",
            observed_at=datetime.now(UTC),
            source_updated_at=self._parse_datetime(
                product.get("lastScrapedAt")
            ),
            raw_data=product,
        )

    @staticmethod
    def _parse_datetime(value: object) -> datetime | None:
        if not isinstance(value, str) or not value.strip():
            return None

        try:
            return datetime.fromisoformat(
                value.strip().replace("Z", "+00:00")
            )
        except ValueError:
            return None