export type MarketHealthInput = {
  sales: number[];
  listings: number[];
};

export type MarketHealthLabel =
  | "Strong"
  | "Healthy"
  | "Mixed"
  | "Weak";

export type MarketHealthResult = {
  score: number;
  label: MarketHealthLabel;
  liquidityScore: number;
  supplyBalanceScore: number;
  priceStabilityScore: number;
  salesCount: number;
  activeListingsCount: number;
  priceVariationPercent: number | null;
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(Math.max(value, minimum), maximum);
}

function calculateAverage(values: number[]) {
  if (values.length === 0) return null;

  return (
    values.reduce((total, value) => total + value, 0) /
    values.length
  );
}

function calculateLiquidityScore(salesCount: number) {
  if (salesCount >= 20) return 100;
  if (salesCount >= 15) return 85;
  if (salesCount >= 10) return 70;
  if (salesCount >= 5) return 50;
  if (salesCount >= 3) return 30;
  if (salesCount >= 1) return 15;

  return 0;
}

function calculateSupplyBalanceScore(
  salesCount: number,
  activeListingsCount: number,
) {
  if (salesCount === 0 && activeListingsCount === 0) {
    return 0;
  }

  if (activeListingsCount === 0) {
    return salesCount > 0 ? 80 : 0;
  }

  const salesToListingsRatio =
    salesCount / activeListingsCount;

  if (salesToListingsRatio >= 2) return 100;
  if (salesToListingsRatio >= 1.25) return 85;
  if (salesToListingsRatio >= 0.75) return 70;
  if (salesToListingsRatio >= 0.4) return 50;
  if (salesToListingsRatio >= 0.2) return 30;

  return 15;
}

function calculatePriceStability(
  sales: number[],
): {
  score: number;
  variationPercent: number | null;
} {
  if (sales.length < 2) {
    return {
      score: sales.length === 1 ? 40 : 0,
      variationPercent: null,
    };
  }

  const average = calculateAverage(sales);

  if (average === null || average <= 0) {
    return {
      score: 0,
      variationPercent: null,
    };
  }

  const variance =
    sales.reduce((total, price) => {
      return total + Math.pow(price - average, 2);
    }, 0) / sales.length;

  const standardDeviation = Math.sqrt(variance);

  const variationPercent =
    (standardDeviation / average) * 100;

  let score: number;

  if (variationPercent <= 2.5) {
    score = 100;
  } else if (variationPercent <= 5) {
    score = 85;
  } else if (variationPercent <= 8) {
    score = 70;
  } else if (variationPercent <= 12) {
    score = 50;
  } else if (variationPercent <= 18) {
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
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 45) return "Mixed";

  return "Weak";
}

export function calculateMarketHealth({
  sales,
  listings,
}: MarketHealthInput): MarketHealthResult {
  const validSales = sales.filter(
    (price) => Number.isFinite(price) && price > 0,
  );

  const validListings = listings.filter(
    (price) => Number.isFinite(price) && price > 0,
  );

  const salesCount = validSales.length;
  const activeListingsCount = validListings.length;

  const liquidityScore =
    calculateLiquidityScore(salesCount);

  const supplyBalanceScore =
    calculateSupplyBalanceScore(
      salesCount,
      activeListingsCount,
    );

  const priceStability =
    calculatePriceStability(validSales);

  const score = Math.round(
    liquidityScore * 0.4 +
      supplyBalanceScore * 0.3 +
      priceStability.score * 0.3,
  );

  const finalScore = clamp(score);

  return {
    score: finalScore,
    label: getMarketHealthLabel(finalScore),
    liquidityScore,
    supplyBalanceScore,
    priceStabilityScore: priceStability.score,
    salesCount,
    activeListingsCount,
    priceVariationPercent:
      priceStability.variationPercent,
  };
}