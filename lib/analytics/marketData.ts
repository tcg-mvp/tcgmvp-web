export type PriceHistoryEntry = {
  price: number | string;
  recorded_at: string;
};

export type MarketDataResult = {
  marketPrice: number | null;
  change30d: number | null;
};

export function calculateMarketData(
  priceHistory: PriceHistoryEntry[]
): MarketDataResult {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      marketPrice: null,
      change30d: null,
    };
  }

  const validHistory = priceHistory
    .map((entry) => ({
      price: Number(entry.price),
      recorded_at: entry.recorded_at,
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.price) &&
        !Number.isNaN(
          new Date(entry.recorded_at).getTime()
        )
    )
    .sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() -
        new Date(b.recorded_at).getTime()
    );

  if (validHistory.length === 0) {
    return {
      marketPrice: null,
      change30d: null,
    };
  }

  const latestEntry =
    validHistory[validHistory.length - 1];

  const latestPrice = latestEntry.price;
  const latestDate = new Date(
    latestEntry.recorded_at
  );

  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - 30);

  const olderEntries = validHistory.filter(
    (entry) =>
      new Date(entry.recorded_at).getTime() <=
      targetDate.getTime()
  );

  const thirtyDayEntry =
    olderEntries.length > 0
      ? olderEntries[olderEntries.length - 1]
      : null;

  const thirtyDayPrice =
    thirtyDayEntry?.price ?? null;

  const change30d =
    thirtyDayPrice !== null &&
    thirtyDayPrice > 0
      ? ((latestPrice - thirtyDayPrice) /
          thirtyDayPrice) *
        100
      : null;

  return {
    marketPrice: latestPrice,
    change30d,
  };
}