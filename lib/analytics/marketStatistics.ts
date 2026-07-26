export type MarketStatisticsPriceEntry = {
  price: number | string;
  recorded_at: string;
};

export type MarketStatisticsSale = {
  total_price: number | string | null;
  sale_price: number | string;
  shipping_price: number | string;
  sold_at: string;
  is_verified?: boolean;
};

export type MarketStatisticsResult = {
  currentPrice: number | null;
  change30d: number | null;
  high52Week: number | null;
  low52Week: number | null;
  allTimeHigh: number | null;
  averageSale: number | null;
  latestSale: number | null;
  salesTracked: number;
  confidence: "High" | "Medium" | "Low" | "Insufficient";
};

function getSaleTotal(sale: MarketStatisticsSale): number | null {
  const totalPrice =
    sale.total_price === null || sale.total_price === undefined
      ? Number(sale.sale_price) + Number(sale.shipping_price)
      : Number(sale.total_price);

  return Number.isFinite(totalPrice) ? totalPrice : null;
}

export function calculateMarketStatistics(
  priceHistory: MarketStatisticsPriceEntry[],
  sales: MarketStatisticsSale[]
): MarketStatisticsResult {
  const validHistory = priceHistory
    .map((entry) => ({
      price: Number(entry.price),
      recorded_at: entry.recorded_at,
      timestamp: new Date(entry.recorded_at).getTime(),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.price) &&
        Number.isFinite(entry.timestamp)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const currentEntry =
    validHistory.length > 0
      ? validHistory[validHistory.length - 1]
      : null;

  const currentPrice = currentEntry?.price ?? null;

  let change30d: number | null = null;

  if (currentEntry) {
    const thirtyDaysInMilliseconds =
      30 * 24 * 60 * 60 * 1000;

    const targetTimestamp =
      currentEntry.timestamp - thirtyDaysInMilliseconds;

    const olderEntries = validHistory.filter(
      (entry) => entry.timestamp <= targetTimestamp
    );

    const thirtyDayEntry =
      olderEntries.length > 0
        ? olderEntries[olderEntries.length - 1]
        : null;

    if (thirtyDayEntry && thirtyDayEntry.price > 0) {
      change30d =
        ((currentEntry.price - thirtyDayEntry.price) /
          thirtyDayEntry.price) *
        100;
    }
  }

  const nowTimestamp =
    currentEntry?.timestamp ?? Date.now();

  const fiftyTwoWeeksInMilliseconds =
    365 * 24 * 60 * 60 * 1000;

  const fiftyTwoWeekStart =
    nowTimestamp - fiftyTwoWeeksInMilliseconds;

  const fiftyTwoWeekHistory = validHistory.filter(
    (entry) => entry.timestamp >= fiftyTwoWeekStart
  );

  const fiftyTwoWeekPrices = fiftyTwoWeekHistory.map(
    (entry) => entry.price
  );

  const allTimePrices = validHistory.map(
    (entry) => entry.price
  );

  const high52Week =
    fiftyTwoWeekPrices.length > 0
      ? Math.max(...fiftyTwoWeekPrices)
      : null;

  const low52Week =
    fiftyTwoWeekPrices.length > 0
      ? Math.min(...fiftyTwoWeekPrices)
      : null;

  const allTimeHigh =
    allTimePrices.length > 0
      ? Math.max(...allTimePrices)
      : null;

  const validSales = sales
    .map((sale) => ({
      total: getSaleTotal(sale),
      sold_at: sale.sold_at,
      timestamp: new Date(sale.sold_at).getTime(),
      is_verified: sale.is_verified ?? false,
    }))
    .filter(
      (
        sale
      ): sale is {
        total: number;
        sold_at: string;
        timestamp: number;
        is_verified: boolean;
      } =>
        sale.total !== null &&
        Number.isFinite(sale.timestamp)
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  const verifiedSales = validSales.filter(
    (sale) => sale.is_verified
  );

  const salesForStatistics =
    verifiedSales.length > 0
      ? verifiedSales
      : validSales;

  const averageSale =
    salesForStatistics.length > 0
      ? salesForStatistics.reduce(
          (sum, sale) => sum + sale.total,
          0
        ) / salesForStatistics.length
      : null;

  const latestSale =
    salesForStatistics.length > 0
      ? salesForStatistics[0].total
      : null;

  const salesTracked = validSales.length;

  let confidence: MarketStatisticsResult["confidence"];

  if (verifiedSales.length >= 10) {
    confidence = "High";
  } else if (verifiedSales.length >= 5) {
    confidence = "Medium";
  } else if (verifiedSales.length >= 1) {
    confidence = "Low";
  } else if (validSales.length > 0) {
    confidence = "Low";
  } else {
    confidence = "Insufficient";
  }

  return {
    currentPrice,
    change30d,
    high52Week,
    low52Week,
    allTimeHigh,
    averageSale,
    latestSale,
    salesTracked,
    confidence,
  };
}