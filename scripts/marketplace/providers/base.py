from __future__ import annotations

from abc import ABC, abstractmethod

from scripts.marketplace.models.market_price import MarketPriceObservation


class MarketPriceProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Stable internal provider name."""

    @abstractmethod
    def fetch_market_price(
        self,
        *,
        product_id: int,
        provider_product_id: str,
    ) -> MarketPriceObservation:
        """Fetch and normalize one market-price observation."""