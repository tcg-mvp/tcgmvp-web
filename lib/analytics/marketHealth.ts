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
  | "Weak";


export type MarketHealthResult = {
  /**
   * Overall market-structure score from 0–100.
   */
  score: number;

  label: MarketHealthLabel;

  /**
   * Transaction depth.
   */
  liquidityScore: number;

  /**
   * Demand/supply absorption.
   */
  supplyBalanceScore: number;

  /**
   * Consistency of realized sale prices.
   */
  priceStabilityScore: number;

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


/*
|--------------------------------------------------------------------------
| Liquidity
|--------------------------------------------------------------------------
|
| Answers:
|
| "How deep is recent transaction activity?"
|
| This deliberately uses verified completed sales,
| not asking-price inventory.
|
| Active supply is evaluated separately through
| Supply Balance.
|
*/

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

  if (salesCount >= 1) {
    return 15;
  }

  return 0;
}


/*
|--------------------------------------------------------------------------
| Supply Balance
|--------------------------------------------------------------------------
|
| Answers:
|
| "How effectively is available supply being
| absorbed by recent transaction demand?"
|
*/

function calculateSupplyBalanceScore(
  salesCount: number,
  activeListingsCount: number,
): number {
  if (
    salesCount === 0 &&
    activeListingsCount === 0
  ) {
    return 0;
  }


  /*
   * Completed sales with no active observed supply
   * imply constrained current availability.
   *
   * Confidence separately determines how much
   * trust should be placed in that observation.
   */
  if (activeListingsCount === 0) {
    return salesCount > 0
      ? 80
      : 0;
  }


  /*
   * Supply exists but no trusted recent demand
   * evidence is available.
   */
  if (salesCount === 0) {
    return 15;
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


/*
|--------------------------------------------------------------------------
| Price Stability
|--------------------------------------------------------------------------
|
| Answers:
|
| "How consistently is this product actually
| transacting?"
|
| Uses coefficient of variation:
|
| standard deviation / average sale price.
|
*/

function calculatePriceStability(
  sales: number[],
): {
  score: number;
  variationPercent: number | null;
} {
  if (sales.length < 2) {
    return {
      score:
        sales.length === 1
          ? 40
          : 0,

      variationPercent:
        null,
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


  /*
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


  /*
   * TCGMVP Market Health
   *
   * Transaction Liquidity: 40%
   * Supply Balance:         30%
   * Price Stability:        30%
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