from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any


@dataclass(slots=True)
class MarketPriceObservation:
    product_id: int
    provider_name: str
    provider_product_id: str
    market_price: Decimal
    currency_code: str
    observed_at: datetime
    source_updated_at: datetime | None
    raw_data: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)

        result["market_price"] = str(self.market_price)
        result["observed_at"] = self.observed_at.isoformat()

        result["source_updated_at"] = (
            self.source_updated_at.isoformat()
            if self.source_updated_at is not None
            else None
        )

        return result