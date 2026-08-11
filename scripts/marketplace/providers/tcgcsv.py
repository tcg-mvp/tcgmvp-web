from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from scripts.marketplace.models.market_price import MarketPriceObservation
from scripts.marketplace.providers.base import MarketPriceProvider


class TCGCSVProvider(MarketPriceProvider):
    BASE_URL = "https://tcgcsv.com/tcgplayer"

    def __init__(self, category_id: int = 3) -> None:
        self.category_id = category_id

    @property
    def provider_name(self) -> str:
        return "tcgcsv"

    def fetch_market_price(
        self,
        *,
        product_id: int,
        provider_product_id: str,
        group_id: int,
    ) -> MarketPriceObservation:
        url = (
            f"{self.BASE_URL}/"
            f"{self.category_id}/"
            f"{group_id}/prices"
        )

        request = Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "TCGMVP/0.1",
            },
            method="GET",
        )

        try:
            with urlopen(request, timeout=30) as response:
                payload = json.loads(
                    response.read().decode("utf-8")
                )

        except HTTPError as exc:
            raise RuntimeError(
                f"TCGCSV returned HTTP {exc.code}."
            ) from exc

        except URLError as exc:
            raise RuntimeError(
                "Could not connect to TCGCSV."
            ) from exc

        records = self._extract_records(payload)

        matching_record = None

        for record in records:
            if str(record.get("productId")) == str(
                provider_product_id
            ):
                matching_record = record
                break

        if matching_record is None:
            raise LookupError(
                "TCGCSV returned no matching price record "
                f"for product ID {provider_product_id} "
                f"in group {group_id}."
            )

        market_price = matching_record.get("marketPrice")

        if market_price is None:
            raise ValueError(
                "TCGCSV returned the product without a marketPrice."
            )

        return MarketPriceObservation(
            product_id=product_id,
            provider_name=self.provider_name,
            provider_product_id=str(provider_product_id),
            market_price=Decimal(str(market_price)),
            currency_code="USD",
            observed_at=datetime.now(UTC),
            source_updated_at=None,
            raw_data=matching_record,
        )

    @staticmethod
    def _extract_records(payload) -> list[dict]:
        if isinstance(payload, list):
            return [
                item
                for item in payload
                if isinstance(item, dict)
            ]

        if isinstance(payload, dict):
            for key in ("results", "data", "prices"):
                value = payload.get(key)

                if isinstance(value, list):
                    return [
                        item
                        for item in value
                        if isinstance(item, dict)
                    ]

        raise ValueError(
            "TCGCSV response did not contain a recognized price list."
        )