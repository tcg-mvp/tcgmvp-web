export type PriceTargetVerdict =
  | "Exceptional"
  | "Strong"
  | "Good"
  | "Fair"
  | "Limited"
  | "Overpriced"
  | "Unrated";

export type PriceTargetConfidence =
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";

export type PriceTargetInput = {
  currentPrice: number | null;
  fairValue: number | null;

  /**
   * Expected range: 0–100
   * Higher means a stronger positive trend.
   */
  trendScore: number;

  /**
   * Expected range: 0–100
   * Higher means greater risk.
   */
  riskScore: number;

  /**
   * Expected range: 0–100
   * Higher means a healthier market.
   */
  marketHealthScore: number;

  /**
   * Expected range: 0–100
   * Higher means stronger investment quality.
   */
  investmentGradeScore: number;

  /**
   * Confidence inputs.
   */
  recentSalesCount: number;
  activeListingsCount: number;
  priceVariationPercent: number | null;
  trendConfidence?: number | null;
};

export type PriceTargetResult = {
  currentPrice: number | null;
  fairValue: number | null;
  targetPrice: number | null;

  potentialUpsidePercent: number | null;
  downsideRiskPercent: number | null;
  marginOfSafetyPercent: number | null;

  targetAdjustmentPercent: number | null;
  valuationAdjustmentPercent: number | null;

  verdict: PriceTargetVerdict;
  confidence: PriceTargetConfidence;
  confidenceScore: number;

  drivers: string[];
  concerns: string[];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function calculateConfidenceScore({
  recentSalesCount,
  activeListingsCount,
  priceVariationPercent,
  trendConfidence,
}: Pick<
  PriceTargetInput,
  | "recentSalesCount"
  | "activeListingsCount"
  | "priceVariationPercent"
  | "trendConfidence"
>) {
  const salesScore = clamp(recentSalesCount * 8, 0, 40);
  const listingsScore = clamp(activeListingsCount * 4, 0, 25);

  let stabilityScore = 10;

  if (priceVariationPercent !== null) {
    if (priceVariationPercent <= 5) {
      stabilityScore = 25;
    } else if (priceVariationPercent <= 10) {
      stabilityScore = 20;
    } else if (priceVariationPercent <= 20) {
      stabilityScore = 14;
    } else if (priceVariationPercent <= 30) {
      stabilityScore = 8;
    } else {
      stabilityScore = 3;
    }
  }

  const normalizedTrendConfidence =
    trendConfidence === null ||
    trendConfidence === undefined
      ? 5
      : clamp(trendConfidence, 0, 100) * 0.1;

  return Math.round(
    clamp(
      salesScore +
        listingsScore +
        stabilityScore +
        normalizedTrendConfidence,
      0,
      100,
    ),
  );
}

function getConfidenceLabel(
  score: number,
): PriceTargetConfidence {
  if (score >= 75) {
    return "High";
  }

  if (score >= 50) {
    return "Medium";
  }

  if (score >= 25) {
    return "Low";
  }

  return "Insufficient";
}

function getVerdict(
  potentialUpsidePercent: number,
  marginOfSafetyPercent: number,
  confidence: PriceTargetConfidence,
): PriceTargetVerdict {
  if (confidence === "Insufficient") {
    return "Unrated";
  }

  if (
    potentialUpsidePercent >= 25 &&
    marginOfSafetyPercent >= 12
  ) {
    return "Exceptional";
  }

  if (
    potentialUpsidePercent >= 15 &&
    marginOfSafetyPercent >= 5
  ) {
    return "Strong";
  }

  if (potentialUpsidePercent >= 8) {
    return "Good";
  }

  if (potentialUpsidePercent >= 0) {
    return "Fair";
  }

  if (potentialUpsidePercent >= -10) {
    return "Limited";
  }

  return "Overpriced";
}

export function calculatePriceTarget(
  input: PriceTargetInput,
): PriceTargetResult {
  const {
    currentPrice,
    fairValue,
    recentSalesCount,
    activeListingsCount,
    priceVariationPercent,
    trendConfidence,
  } = input;

  const confidenceScore = calculateConfidenceScore({
    recentSalesCount,
    activeListingsCount,
    priceVariationPercent,
    trendConfidence,
  });

  const confidence =
    getConfidenceLabel(confidenceScore);

  if (
    currentPrice === null ||
    fairValue === null ||
    currentPrice <= 0 ||
    fairValue <= 0
  ) {
    return {
      currentPrice,
      fairValue,
      targetPrice: null,
      potentialUpsidePercent: null,
      downsideRiskPercent: null,
      marginOfSafetyPercent: null,
      targetAdjustmentPercent: null,
      valuationAdjustmentPercent: null,
      verdict: "Unrated",
      confidence: "Insufficient",
      confidenceScore,
      drivers: [],
      concerns: [
        "A valid current price and fair value are required.",
      ],
    };
  }

  const trendScore = clamp(input.trendScore, 0, 100);
  const riskScore = clamp(input.riskScore, 0, 100);
  const marketHealthScore = clamp(
    input.marketHealthScore,
    0,
    100,
  );
  const investmentGradeScore = clamp(
    input.investmentGradeScore,
    0,
    100,
  );

  /*
   * Each factor is centered around 50.
   *
   * Trend can move the target approximately ±10%.
   * Market Health can move it approximately ±6%.
   * Investment Grade can move it approximately ±6%.
   * Risk can move it approximately ±10%.
   */
  /*
 * Valuation gap:
 *
 * Positive = current price is below fair value.
 * Negative = current price is above fair value.
 */
const valuationGapPercent =
  ((fairValue - currentPrice) / fairValue) * 100;

/*
 * Apply 20% of the valuation gap, capped at ±4%.
 *
 * Examples:
 * 10% below fair value = +2% adjustment
 * 20% below fair value = +4% adjustment
 * 10% above fair value = -2% adjustment
 * 20% above fair value = -4% adjustment
 */
const valuationAdjustment = clamp(
  (valuationGapPercent / 100) * 0.2,
  -0.04,
  0.04,
);
  const trendAdjustment =
    ((trendScore - 50) / 50) * 0.1;

  const marketHealthAdjustment =
    ((marketHealthScore - 50) / 50) * 0.06;

  const investmentGradeAdjustment =
    ((investmentGradeScore - 50) / 50) * 0.06;

  const riskAdjustment =
    -((riskScore - 50) / 50) * 0.1;

  const rawAdjustment =
   trendAdjustment +
   marketHealthAdjustment +
   investmentGradeAdjustment +
   riskAdjustment +
   valuationAdjustment;

  /*
   * Low-confidence targets should remain closer to fair value.
   */
  const confidenceMultiplier =
    confidence === "High"
      ? 1
      : confidence === "Medium"
        ? 0.75
        : confidence === "Low"
          ? 0.45
          : 0.2;

  const adjustedTargetChange =
    rawAdjustment * confidenceMultiplier;

  /*
   * Prevent the initial model from producing unrealistic
   * targets. This can be widened during refinement.
   */
  const boundedTargetChange = clamp(
    adjustedTargetChange,
    -0.18,
    0.22,
  );

  const targetPrice = roundCurrency(
    fairValue * (1 + boundedTargetChange),
  );

  const potentialUpsidePercent = roundPercent(
    ((targetPrice - currentPrice) / currentPrice) * 100,
  );

  const marginOfSafetyPercent = roundPercent(
    ((fairValue - currentPrice) / fairValue) * 100,
  );

  const downsideReference = Math.min(
    fairValue,
    targetPrice,
  );

  const downsideRiskPercent = roundPercent(
    Math.max(
      0,
      ((currentPrice - downsideReference) /
        currentPrice) *
        100,
    ),
  );

  const targetAdjustmentPercent = roundPercent(
    boundedTargetChange * 100,
  );

  const valuationAdjustmentPercent = roundPercent(
  valuationAdjustment * 100,
);

  const verdict = getVerdict(
    potentialUpsidePercent,
    marginOfSafetyPercent,
    confidence,
  );

  const drivers: string[] = [];
  const concerns: string[] = [];
  
  if (valuationGapPercent >= 10) {
  drivers.push(
    "The current price is meaningfully below estimated fair value.",
  );
} else if (valuationGapPercent >= 3) {
  drivers.push(
    "The current price is modestly below estimated fair value.",
  );
} else if (valuationGapPercent <= -10) {
  concerns.push(
    "The current price is meaningfully above estimated fair value.",
  );
} else if (valuationGapPercent <= -3) {
  concerns.push(
    "The current price is modestly above estimated fair value.",
  );
}

  if (trendScore >= 65) {
    drivers.push(
      "Positive market trend supports a higher target.",
    );
  } else if (trendScore <= 35) {
    concerns.push(
      "Weak market momentum limits the target.",
    );
  }

  if (marketHealthScore >= 65) {
    drivers.push(
      "Healthy liquidity and market stability support pricing.",
    );
  } else if (marketHealthScore <= 35) {
    concerns.push(
      "Weak market health reduces target reliability.",
    );
  }

  if (investmentGradeScore >= 65) {
    drivers.push(
      "Strong investment quality supports long-term demand.",
    );
  } else if (investmentGradeScore <= 35) {
    concerns.push(
      "Low investment quality limits appreciation potential.",
    );
  }

  if (riskScore <= 35) {
    drivers.push(
      "Lower market risk supports a stronger valuation.",
    );
  } else if (riskScore >= 65) {
    concerns.push(
      "Elevated risk applies downward pressure to the target.",
    );
  }

  if (marginOfSafetyPercent >= 10) {
    drivers.push(
        "The current price provides a meaningful margin of safety.",
    );
  }

  if (confidence === "Low") {
    concerns.push(
      "Limited market evidence reduces target confidence.",
    );
  }

  if (confidence === "Insufficient") {
    concerns.push(
      "There is not enough market evidence for a reliable target.",
    );
  }

  return {
    currentPrice: roundCurrency(currentPrice),
    fairValue: roundCurrency(fairValue),
    targetPrice,
    potentialUpsidePercent,
    downsideRiskPercent,
    marginOfSafetyPercent,
    targetAdjustmentPercent,
    valuationAdjustmentPercent,
    verdict,
    confidence,
    confidenceScore,
    drivers,
    concerns,
  };
}