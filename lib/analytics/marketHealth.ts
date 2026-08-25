export type MarketHealthInput = {
  /**
   * Verified realized sale prices.
   */
  sales: number[];

  /**
   * Valid active listing prices.
   *
   * These remain available as supporting evidence
   * and as a fallback for listing depth when the
   * canonical snapshot count is unavailable.
   */
  listings: number[];

  /**
   * Canonical active-listing count from the latest
   * trusted eBay marketplace snapshot.
   */
  activeListingsCount?: number;
};


export type MarketHealthLabel =
  | "Strong"
  | "Healthy"
  | "Mixed"
  | "Weak"
  | "Unavailable";


export type MarketHealthResult = {
  /**
   * Overall market-structure score from 0–100.
   *
   * Null means there is not enough verified
   * transaction evidence to calculate Market Health.
   */
  score: number | null;

  label: MarketHealthLabel;

  /**
   * Transaction depth.
   *
   * Null when no verified transaction evidence exists.
   */
  liquidityScore: number | null;

  /**
   * Demand/supply absorption.
   *
   * Requires realized demand evidence, so this is
   * null when there are no verified sales.
   */
  supplyBalanceScore: number | null;

  /**
   * Consistency of realized sale prices.
   *
   * Null when no verified transaction evidence exists.
   */
  priceStabilityScore: number | null;

  salesCount: number;

  activeListingsCount: number;

  /**
   * Coefficient of variation for verified
   * realized sale prices.
   */
  priceVariationPercent: number | null;
};


function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  );
}


function calculateAverage(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  );
}


function calculateLiquidityScore(
  salesCount: number,
): number {
  if (salesCount >= 20) {
    return 100;
  }

  if (salesCount >= 15) {
    return 85;
  }

  if (salesCount >= 10) {
    return 70;
  }

  if (salesCount >= 5) {
    return 50;
  }

  if (salesCount >= 3) {
    return 30;
  }

  return 15;
}


function calculateSupplyBalanceScore(
  salesCount: number,
  activeListingsCount: number,
): number {
  if (activeListingsCount === 0) {
    return 80;
  }


  const salesToListingsRatio =
    salesCount /
    activeListingsCount;


  if (salesToListingsRatio >= 2) {
    return 100;
  }

  if (salesToListingsRatio >= 1.25) {
    return 85;
  }

  if (salesToListingsRatio >= 0.75) {
    return 70;
  }

  if (salesToListingsRatio >= 0.4) {
    return 50;
  }

  if (salesToListingsRatio >= 0.2) {
    return 30;
  }

  return 15;
}


function calculatePriceStability(
  sales: number[],
): {
  score: number;
  variationPercent: number | null;
} {
  if (sales.length === 1) {
    return {
      score: 40,
      variationPercent: null,
    };
  }


  const average =
    calculateAverage(
      sales,
    );


  if (
    average === null ||
    average <= 0
  ) {
    return {
      score: 0,
      variationPercent: null,
    };
  }


  const variance =
    sales.reduce(
      (
        total,
        price,
      ) =>
        total +
        Math.pow(
          price - average,
          2,
        ),
      0,
    ) /
    sales.length;


  const standardDeviation =
    Math.sqrt(
      variance,
    );


  const variationPercent =
    (
      standardDeviation /
      average
    ) *
    100;


  let score: number;


  if (variationPercent <= 2.5) {
    score = 100;
  } else if (
    variationPercent <= 5
  ) {
    score = 85;
  } else if (
    variationPercent <= 8
  ) {
    score = 70;
  } else if (
    variationPercent <= 12
  ) {
    score = 50;
  } else if (
    variationPercent <= 18
  ) {
    score = 30;
  } else {
    score = 15;
  }


  return {
    score,
    variationPercent,
  };
}


function getMarketHealthLabel(
  score: number,
): MarketHealthLabel {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 70) {
    return "Healthy";
  }

  if (score >= 45) {
    return "Mixed";
  }

  return "Weak";
}


export function calculateMarketHealth({
  sales,
  listings,
  activeListingsCount,
}: MarketHealthInput): MarketHealthResult {
  const validSales =
    sales.filter(
      (price) =>
        Number.isFinite(
          price,
        ) &&
        price > 0,
    );


  const validListings =
    listings.filter(
      (price) =>
        Number.isFinite(
          price,
        ) &&
        price > 0,
    );


  const salesCount =
    validSales.length;


  /**
   * Prefer the canonical latest marketplace
   * snapshot rather than the number of listings
   * rendered in the UI.
   */
  const resolvedActiveListingsCount =
    activeListingsCount !== undefined &&
    Number.isFinite(
      activeListingsCount,
    ) &&
    activeListingsCount >= 0
      ? Math.floor(
          activeListingsCount,
        )
      : validListings.length;


  /**
   * No verified realized-sale evidence.
   *
   * Market Health is fundamentally a
   * transaction-market assessment:
   *
   * - Liquidity requires completed transactions.
   * - Supply Balance requires observed demand
   *   relative to visible supply.
   * - Price Stability requires realized prices.
   *
   * Active listings remain useful evidence and are
   * preserved, but they cannot independently prove
   * whether the transaction market is healthy.
   *
   * Missing evidence therefore returns unavailable
   * rather than an artificial zero or weak score.
   */
  if (salesCount === 0) {
    return {
      score: null,

      label:
        "Unavailable",

      liquidityScore:
        null,

      supplyBalanceScore:
        null,

      priceStabilityScore:
        null,

      salesCount,

      activeListingsCount:
        resolvedActiveListingsCount,

      priceVariationPercent:
        null,
    };
  }


  const liquidityScore =
    calculateLiquidityScore(
      salesCount,
    );


  const supplyBalanceScore =
    calculateSupplyBalanceScore(
      salesCount,
      resolvedActiveListingsCount,
    );


  const priceStability =
    calculatePriceStability(
      validSales,
    );


  /**
   * TCGMVP Market Health
   *
   * Transaction Liquidity: 40%
   * Supply Balance:         30%
   * Price Stability:        30%
   *
   * Once at least one verified transaction exists,
   * the engine can produce a preliminary structural
   * assessment.
   *
   * Shared Market Confidence remains responsible
   * for communicating how strongly that assessment
   * should be trusted.
   */
  const rawScore =
    liquidityScore * 0.40 +
    supplyBalanceScore * 0.30 +
    priceStability.score * 0.30;


  const score =
    Math.round(
      clamp(
        rawScore,
      ),
    );


  return {
    score,

    label:
      getMarketHealthLabel(
        score,
      ),

    liquidityScore,

    supplyBalanceScore,

    priceStabilityScore:
      priceStability.score,

    salesCount,

    activeListingsCount:
      resolvedActiveListingsCount,

    priceVariationPercent:
      priceStability.variationPercent,
  };
}