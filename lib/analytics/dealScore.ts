export type DealScoreInput = {
  fairMarketValue: number;
  listingPrice: number;
  recentSalesCount: number;
  activeListingsCount: number;
};

export type DealScoreResult = {
  score: number;
  label: string;
  discountPercent: number;
  priceScore: number;
  confidenceScore: number;
  liquidityScore: number;
  confidenceLabel: "Low" | "Medium" | "High";
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getConfidenceScore(salesCount: number) {
  if (salesCount <= 0) return 0;
  if (salesCount <= 2) return 25;
  if (salesCount <= 5) return 50;
  if (salesCount <= 10) return 75;

  return 100;
}

function getConfidenceLabel(
  salesCount: number,
): "Low" | "Medium" | "High" {
  if (salesCount >= 10) return "High";
  if (salesCount >= 4) return "Medium";

  return "Low";
}

function getLiquidityScore(
  recentSalesCount: number,
  activeListingsCount: number,
) {
  if (recentSalesCount <= 0) {
    return 0;
  }

  const totalMarketActivity =
    recentSalesCount + Math.max(activeListingsCount, 0);

  if (totalMarketActivity === 0) {
    return 0;
  }

  const sellThroughRatio = recentSalesCount / totalMarketActivity;

  if (sellThroughRatio >= 0.75) return 100;
  if (sellThroughRatio >= 0.5) return 85;
  if (sellThroughRatio >= 0.25) return 65;
  if (sellThroughRatio >= 0.1) return 40;

  return 20;
}

function getDealLabel(score: number) {
  if (score >= 90) return "Exceptional Deal";
  if (score >= 80) return "Strong Deal";
  if (score >= 70) return "Good Deal";
  if (score >= 60) return "Slightly Below Market";
  if (score >= 45) return "Fair Market Price";
  if (score >= 30) return "Overpriced";

  return "Poor Value";
}

export function calculateDealScore({
  fairMarketValue,
  listingPrice,
  recentSalesCount,
  activeListingsCount,
}: DealScoreInput): DealScoreResult | null {
  if (
    !Number.isFinite(fairMarketValue) ||
    !Number.isFinite(listingPrice) ||
    fairMarketValue <= 0 ||
    listingPrice <= 0
  ) {
    return null;
  }

  const discountPercent =
    ((fairMarketValue - listingPrice) / fairMarketValue) * 100;

  /*
   * At market value = 50
   * 5% below market = 65
   * 10% below market = 80
   * 15% below market = 95
   */
  const priceScore = clamp(50 + discountPercent * 3);

  const confidenceScore = getConfidenceScore(recentSalesCount);

  const liquidityScore = getLiquidityScore(
    recentSalesCount,
    activeListingsCount,
  );

  const score = Math.round(
    priceScore * 0.6 +
      confidenceScore * 0.2 +
      liquidityScore * 0.2,
  );

  return {
    score,
    label: getDealLabel(score),
    discountPercent,
    priceScore: Math.round(priceScore),
    confidenceScore,
    liquidityScore,
    confidenceLabel: getConfidenceLabel(recentSalesCount),
  };
}