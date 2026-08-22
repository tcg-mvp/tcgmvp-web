export type InvestmentGradeInput = {
  /**
   * Overall market-structure quality from
   * marketHealth.ts.
   */
  marketHealthScore: number;

  /**
   * Current valuation opportunity from
   * dealScore.ts.
   */
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
  /**
   * Overall investment-quality score.
   */
  score: number;

  grade: InvestmentGrade;

  label: InvestmentGradeLabel;

  /**
   * Structural market quality.
   */
  marketQualityScore: number;

  /**
   * Current valuation opportunity.
   */
  opportunityScore: number;
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


function getGrade(
  score: number,
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
  score: number,
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
  dealScore,
}: InvestmentGradeInput): InvestmentGradeResult {
  const marketQualityScore =
    Math.round(
      clamp(
        marketHealthScore,
      ),
    );


  const opportunityScore =
    Math.round(
      clamp(
        dealScore,
      ),
    );


  /*
   * Investment Grade answers:
   *
   * "How strong is this product's investable
   * market setup?"
   *
   * Market Quality:
   * - transaction liquidity
   * - supply balance
   * - price stability
   *
   * Opportunity:
   * - current market price vs Fair Value
   *
   * Risk is intentionally excluded because
   * riskAnalysis.ts is the authoritative
   * risk engine.
   */
  const rawScore =
    marketQualityScore * 0.75 +
    opportunityScore * 0.25;


  const score =
    Math.round(
      clamp(
        rawScore,
      ),
    );


  return {
    score,

    grade:
      getGrade(
        score,
      ),

    label:
      getLabel(
        score,
      ),

    marketQualityScore,

    opportunityScore,
  };
}