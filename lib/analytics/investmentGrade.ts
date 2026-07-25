export type InvestmentGradeInput = {
  marketHealthScore: number;
  liquidityScore: number;
  supplyBalanceScore: number;
  priceStabilityScore: number;
  dealScore: number;
};

export type InvestmentGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D";

export type InvestmentGradeLabel =
  | "Exceptional"
  | "Strong"
  | "Above Average"
  | "Moderate"
  | "Speculative"
  | "Weak";

export type InvestmentGradeResult = {
  score: number;
  grade: InvestmentGrade;
  label: InvestmentGradeLabel;
  marketQualityScore: number;
  opportunityScore: number;
  riskScore: number;
};

function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getGrade(score: number): InvestmentGrade {
  if (score >= 93) return "A+";
  if (score >= 87) return "A";
  if (score >= 82) return "A-";
  if (score >= 78) return "B+";
  if (score >= 73) return "B";
  if (score >= 68) return "B-";
  if (score >= 63) return "C+";
  if (score >= 58) return "C";
  if (score >= 50) return "C-";

  return "D";
}

function getLabel(
  score: number,
): InvestmentGradeLabel {
  if (score >= 93) return "Exceptional";
  if (score >= 82) return "Strong";
  if (score >= 73) return "Above Average";
  if (score >= 63) return "Moderate";
  if (score >= 50) return "Speculative";

  return "Weak";
}

export function calculateInvestmentGrade({
  marketHealthScore,
  liquidityScore,
  supplyBalanceScore,
  priceStabilityScore,
  dealScore,
}: InvestmentGradeInput): InvestmentGradeResult {
  const safeMarketHealthScore = clamp(marketHealthScore);
  const safeLiquidityScore = clamp(liquidityScore);
  const safeSupplyBalanceScore = clamp(supplyBalanceScore);
  const safePriceStabilityScore = clamp(priceStabilityScore);
  const safeDealScore = clamp(dealScore);

  /*
   * Market Quality measures the strength and reliability
   * of the underlying market.
   */
  const marketQualityScore = Math.round(
    safeMarketHealthScore * 0.4 +
      safeLiquidityScore * 0.2 +
      safeSupplyBalanceScore * 0.2 +
      safePriceStabilityScore * 0.2,
  );

  /*
   * Opportunity measures whether the current pricing
   * appears attractive relative to fair value.
   */
  const opportunityScore = safeDealScore;

  /*
   * Risk increases when liquidity, stability, or supply
   * balance are weak.
   */
  const riskScore = Math.round(
    100 -
      (safeLiquidityScore * 0.35 +
        safeSupplyBalanceScore * 0.3 +
        safePriceStabilityScore * 0.35),
  );

  /*
   * Investment Grade favors market quality over current
   * deal attractiveness so a temporary discount cannot
   * make a weak market look like a strong investment.
   */
  const rawScore =
    marketQualityScore * 0.7 +
    opportunityScore * 0.3;

  const score = Math.round(clamp(rawScore));

  return {
    score,
    grade: getGrade(score),
    label: getLabel(score),
    marketQualityScore,
    opportunityScore,
    riskScore: clamp(riskScore),
  };
}