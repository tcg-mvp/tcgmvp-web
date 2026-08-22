export type MarketStatisticsPriceEntry = {
  price: number | string;
  recorded_at: string;
};

export type MarketStatisticsSale = {
  total_price: number | string | null;
  sale_price: number | string;
  shipping_price: number | string | null;
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
};


function getSalePrice(
  sale: MarketStatisticsSale
): number | null {
  const salePrice =
    Number(sale.sale_price);

  return Number.isFinite(
    salePrice
  ) &&
    salePrice > 0
    ? salePrice
    : null;
}


export function calculateMarketStatistics(
  priceHistory: MarketStatisticsPriceEntry[],
  sales: MarketStatisticsSale[]
): MarketStatisticsResult {
  const validHistory =
    priceHistory
      .map((entry) => ({
        price:
          Number(entry.price),

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


  const currentEntry =
    validHistory.length > 0
      ? validHistory[
          validHistory.length - 1
        ]
      : null;


  const currentPrice =
    currentEntry?.price ??
    null;


  let change30d:
    number | null =
    null;


  if (currentEntry) {
    const thirtyDaysInMilliseconds =
      30 *
      24 *
      60 *
      60 *
      1000;

    const targetTimestamp =
      currentEntry.timestamp -
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

    if (
      thirtyDayEntry &&
      thirtyDayEntry.price > 0
    ) {
      change30d =
        (
          (
            currentEntry.price -
            thirtyDayEntry.price
          ) /
          thirtyDayEntry.price
        ) *
        100;
    }
  }


  const referenceTimestamp =
    currentEntry?.timestamp ??
    Date.now();


  const fiftyTwoWeeksInMilliseconds =
    365 *
    24 *
    60 *
    60 *
    1000;


  const fiftyTwoWeekStart =
    referenceTimestamp -
    fiftyTwoWeeksInMilliseconds;


  const fiftyTwoWeekPrices =
    validHistory
      .filter(
        (entry) =>
          entry.timestamp >=
          fiftyTwoWeekStart
      )
      .map(
        (entry) =>
          entry.price
      );


  const allTimePrices =
    validHistory.map(
      (entry) =>
        entry.price
    );


  const high52Week =
    fiftyTwoWeekPrices.length > 0
      ? Math.max(
          ...fiftyTwoWeekPrices
        )
      : null;


  const low52Week =
    fiftyTwoWeekPrices.length > 0
      ? Math.min(
          ...fiftyTwoWeekPrices
        )
      : null;


  const allTimeHigh =
    allTimePrices.length > 0
      ? Math.max(
          ...allTimePrices
        )
      : null;


  /*
   * Only verified transactions are allowed
   * to influence sales-derived statistics.
   *
   * Unverified records may remain visible
   * elsewhere in the evidence UI, but they
   * are not used analytically here.
   */
  const verifiedSales =
    sales
      .filter(
        (sale) =>
          sale.is_verified ===
          true
      )
      .map((sale) => ({
        price:
          getSalePrice(
            sale
          ),

        sold_at:
          sale.sold_at,

        timestamp:
          new Date(
            sale.sold_at
          ).getTime(),
      }))
      .filter(
        (
          sale
        ): sale is {
          price: number;
          sold_at: string;
          timestamp: number;
        } =>
          sale.price !== null &&
          Number.isFinite(
            sale.timestamp
          )
      )
      .sort(
        (a, b) =>
          b.timestamp -
          a.timestamp
      );


  const averageSale =
    verifiedSales.length > 0
      ? verifiedSales.reduce(
          (
            total,
            sale
          ) =>
            total +
            sale.price,
          0
        ) /
        verifiedSales.length
      : null;


  /*
   * SoldComps currently provides date-level
   * sold timestamps rather than exact sale
   * times.
   */
  const latestSale =
    verifiedSales.length > 0
      ? verifiedSales[0]
          .price
      : null;


  const salesTracked =
    verifiedSales.length;


  return {
    currentPrice,

    change30d,

    high52Week,

    low52Week,

    allTimeHigh,

    averageSale,

    latestSale,

    salesTracked,
  };
}