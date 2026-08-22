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
  if (
    !priceHistory ||
    priceHistory.length === 0
  ) {
    return {
      marketPrice: null,
      change30d: null,
    };
  }


  const validHistory =
    priceHistory
      .map((entry) => ({
        price:
          Number(
            entry.price
          ),

        recorded_at:
          entry.recorded_at,

        timestamp:
          new Date(
            entry.recorded_at
          ).getTime(),
      }))
      .filter(
        (entry) =>
          Number.isFinite(
            entry.price
          ) &&
          entry.price > 0 &&
          Number.isFinite(
            entry.timestamp
          )
      )
      .sort(
        (a, b) =>
          a.timestamp -
          b.timestamp
      );


  if (
    validHistory.length === 0
  ) {
    return {
      marketPrice: null,
      change30d: null,
    };
  }


  const latestEntry =
    validHistory[
      validHistory.length - 1
    ];


  const latestPrice =
    latestEntry.price;


  const thirtyDaysInMilliseconds =
    30 *
    24 *
    60 *
    60 *
    1000;


  const targetTimestamp =
    latestEntry.timestamp -
    thirtyDaysInMilliseconds;


  const olderEntries =
    validHistory.filter(
      (entry) =>
        entry.timestamp <=
        targetTimestamp
    );


  const thirtyDayEntry =
    olderEntries.length > 0
      ? olderEntries[
          olderEntries.length - 1
        ]
      : null;


  const thirtyDayPrice =
    thirtyDayEntry?.price ??
    null;


  const change30d =
    thirtyDayPrice !== null &&
    thirtyDayPrice > 0
      ? (
          (
            latestPrice -
            thirtyDayPrice
          ) /
          thirtyDayPrice
        ) *
        100
      : null;


  return {
    marketPrice:
      latestPrice,

    change30d,
  };
}