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
  maximum = 100
): number {
  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );
}


function getGrade(
  score: number
): InvestmentGrade {
  if (score >= 93) {
    return "A+";
  }

  if (score >= 87) {
    return "A";
  }

  if (score >= 82) {
    return "A-";
  }

  if (score >= 78) {
    return "B+";
  }

  if (score >= 73) {
    return "B";
  }

  if (score >= 68) {
    return "B-";
  }

  if (score >= 63) {
    return "C+";
  }

  if (score >= 58) {
    return "C";
  }

  if (score >= 50) {
    return "C-";
  }

  return "D";
}


function getLabel(
  score: number
): InvestmentGradeLabel {
  if (score >= 93) {
    return "Exceptional";
  }

  if (score >= 82) {
    return "Strong";
  }

  if (score >= 73) {
    return "Above Average";
  }

  if (score >= 63) {
    return "Moderate";
  }

  if (score >= 50) {
    return "Speculative";
  }

  return "Weak";
}


export function calculateInvestmentGrade({
  marketHealthScore,
  liquidityScore,
  supplyBalanceScore,
  priceStabilityScore,
  dealScore,
}: InvestmentGradeInput): InvestmentGradeResult {
  const safeMarketHealthScore =
    clamp(
      marketHealthScore
    );

  const safeLiquidityScore =
    clamp(
      liquidityScore
    );

  const safeSupplyBalanceScore =
    clamp(
      supplyBalanceScore
    );

  const safePriceStabilityScore =
    clamp(
      priceStabilityScore
    );

  const safeDealScore =
    clamp(
      dealScore
    );


  /*
   * Market Quality
   *
   * marketHealthScore already combines:
   * - liquidity
   * - supply balance
   * - price stability
   *
   * Use it directly to avoid double-counting
   * those same components.
   */
  const marketQualityScore =
    Math.round(
      safeMarketHealthScore
    );


  /*
   * Opportunity
   *
   * Deal Score represents how attractive the
   * current entry appears relative to Fair Value.
   */
  const opportunityScore =
    Math.round(
      safeDealScore
    );


  /*
   * Structural Risk
   *
   * Keep this as a separate descriptive output.
   * It is derived directly from the underlying
   * market-quality components.
   *
   * High liquidity, balanced supply, and stable
   * pricing reduce structural market risk.
   */
  const riskScore =
    Math.round(
      clamp(
        100 -
          (
            safeLiquidityScore *
              0.35 +
            safeSupplyBalanceScore *
              0.30 +
            safePriceStabilityScore *
              0.35
          )
      )
    );


  /*
   * Investment Grade
   *
   * Market quality receives the majority of the
   * weight so a temporary discount cannot turn a
   * weak market into an elite investment.
   *
   * Current opportunity still matters, but remains
   * secondary.
   */
  const rawScore =
    marketQualityScore *
      0.75 +
    opportunityScore *
      0.25;


  const score =
    Math.round(
      clamp(
        rawScore
      )
    );


  return {
    score,

    grade:
      getGrade(
        score
      ),

    label:
      getLabel(
        score
      ),

    marketQualityScore,

    opportunityScore,

    riskScore,
  };
}