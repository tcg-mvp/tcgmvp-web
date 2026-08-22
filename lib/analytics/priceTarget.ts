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
  /*
   * Broader reference market price.
   *
   * Useful for context, historical comparisons,
   * and market statistics.
   *
   * This is NOT assumed to be an actionable
   * purchase price.
   */
  referencePrice: number | null;

  /*
   * Lowest eligible actionable active listing.
   *
   * Investor return, valuation gap, and margin
   * of safety are measured from this price.
   */
  entryPrice: number | null;

  fairValue: number | null;

  /*
   * Expected range: 0–100.
   *
   * Higher means stronger positive
   * price momentum.
   */
  trendScore: number;

  /*
   * Expected range: 0–100.
   *
   * Higher means greater market risk.
   */
  riskScore: number;

  /*
   * Shared Market Confidence generated
   * by confidence.ts.
   */
  marketConfidenceScore: number;

  marketConfidence:
    PriceTargetConfidence;
};


export type PriceTargetResult = {
  referencePrice: number | null;

  entryPrice: number | null;

  fairValue: number | null;

  targetPrice: number | null;

  potentialUpsidePercent:
    number | null;

  downsideRiskPercent:
    number | null;

  marginOfSafetyPercent:
    number | null;

  targetAdjustmentPercent:
    number | null;

  /*
   * Retained temporarily for compatibility
   * with the existing UI.
   *
   * Fair Value is already the valuation
   * anchor, so valuation is not applied
   * again as a target adjustment.
   */
  valuationAdjustmentPercent:
    number | null;

  verdict:
    PriceTargetVerdict;

  confidence:
    PriceTargetConfidence;

  confidenceScore: number;

  drivers: string[];

  concerns: string[];
};


function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );
}


function roundCurrency(
  value: number
): number {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}


function roundPercent(
  value: number
): number {
  return (
    Math.round(
      value * 10
    ) / 10
  );
}


function getVerdict(
  potentialUpsidePercent: number,
  marginOfSafetyPercent: number,
  confidence: PriceTargetConfidence
): PriceTargetVerdict {
  if (
    confidence ===
    "Insufficient"
  ) {
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

  if (
    potentialUpsidePercent >= 8
  ) {
    return "Good";
  }

  if (
    potentialUpsidePercent >= 0
  ) {
    return "Fair";
  }

  if (
    potentialUpsidePercent >= -10
  ) {
    return "Limited";
  }

  return "Overpriced";
}


export function calculatePriceTarget(
  input: PriceTargetInput
): PriceTargetResult {
  const {
    referencePrice,
    entryPrice,
    fairValue,
    marketConfidenceScore,
    marketConfidence,
  } = input;


  const confidenceScore =
    Math.round(
      clamp(
        marketConfidenceScore,
        0,
        100
      )
    );


  const confidence =
    marketConfidence;


  /*
   * A forward target requires:
   *
   * - a valid actionable entry price
   * - a valid Fair Value anchor
   *
   * Reference price is contextual and is
   * therefore not required for calculation.
   */
  if (
    entryPrice === null ||
    fairValue === null ||
    entryPrice <= 0 ||
    fairValue <= 0
  ) {
    return {
      referencePrice:
        referencePrice !== null &&
        referencePrice > 0
          ? roundCurrency(
              referencePrice
            )
          : null,

      entryPrice:
        entryPrice !== null &&
        entryPrice > 0
          ? roundCurrency(
              entryPrice
            )
          : null,

      fairValue:
        fairValue !== null &&
        fairValue > 0
          ? roundCurrency(
              fairValue
            )
          : null,

      targetPrice: null,

      potentialUpsidePercent:
        null,

      downsideRiskPercent:
        null,

      marginOfSafetyPercent:
        null,

      targetAdjustmentPercent:
        null,

      valuationAdjustmentPercent:
        null,

      verdict:
        "Unrated",

      confidence:
        "Insufficient",

      confidenceScore,

      drivers: [],

      concerns: [
        "A valid actionable entry price and fair value are required.",
      ],
    };
  }


  const trendScore =
    clamp(
      input.trendScore,
      0,
      100
    );


  const riskScore =
    clamp(
      input.riskScore,
      0,
      100
    );


  /*
   * Entry valuation.
   *
   * Positive:
   * actionable entry price is below Fair Value.
   *
   * Negative:
   * actionable entry price is above Fair Value.
   *
   * This determines margin of safety and
   * contributes to the verdict.
   *
   * It does NOT modify the target because
   * Fair Value is already the valuation anchor.
   */
  const valuationGapPercent =
    (
      (
        fairValue -
        entryPrice
      ) /
      fairValue
    ) *
    100;


  /*
   * --------------------------------------------------
   * FORWARD PRICE MODEL
   * --------------------------------------------------
   *
   * Fair Value is the starting point.
   *
   * Only genuinely forward-looking factors
   * modify that valuation:
   *
   * 1. Trend
   * 2. Risk
   *
   * Market Health is intentionally excluded
   * because it describes current market
   * structure rather than directional price.
   *
   * Investment Grade is intentionally excluded
   * because it is derived from Market Health
   * and Deal Score and would therefore
   * double-count existing evidence.
   *
   * Reference Price is intentionally excluded
   * from the target adjustment. It remains
   * useful market context but is not treated
   * as an executable investor entry.
   */


  /*
   * Trend adjustment
   *
   * Score 50 = neutral
   * Score 100 = +12%
   * Score 0 = -12%
   */
  const trendAdjustment =
    (
      (
        trendScore -
        50
      ) /
      50
    ) *
    0.12;


  /*
   * Risk adjustment
   *
   * Score 50 = neutral
   * Score 100 = -8%
   * Score 0 = +8%
   *
   * Lower risk permits a moderately higher
   * forward valuation while elevated risk
   * reduces it.
   */
  const riskAdjustment =
    -(
      (
        riskScore -
        50
      ) /
      50
    ) *
    0.08;


  const rawAdjustment =
    trendAdjustment +
    riskAdjustment;


  /*
   * Confidence controls conviction.
   *
   * Lower-confidence forecasts remain closer
   * to present Fair Value rather than making
   * aggressive projections from weak evidence.
   */
  const confidenceMultiplier =
    confidence === "High"
      ? 1
      : confidence === "Medium"
        ? 0.75
        : confidence === "Low"
          ? 0.45
          : 0;


  const adjustedTargetChange =
    rawAdjustment *
    confidenceMultiplier;


  /*
   * Safety bounds.
   *
   * The MVP target model should remain
   * deliberately conservative.
   */
  const boundedTargetChange =
    clamp(
      adjustedTargetChange,
      -0.15,
      0.20
    );


  const targetPrice =
    roundCurrency(
      fairValue *
      (
        1 +
        boundedTargetChange
      )
    );


  /*
   * Expected investor return from the
   * actionable entry price to the target.
   */
  const potentialUpsidePercent =
    roundPercent(
      (
        (
          targetPrice -
          entryPrice
        ) /
        entryPrice
      ) *
      100
    );


  /*
   * Current actionable margin of safety.
   */
  const marginOfSafetyPercent =
    roundPercent(
      valuationGapPercent
    );


  /*
   * Downside reference.
   *
   * Use whichever is more conservative:
   * present Fair Value or forward target.
   */
  const downsideReference =
    Math.min(
      fairValue,
      targetPrice
    );


  const downsideRiskPercent =
    roundPercent(
      Math.max(
        0,
        (
          (
            entryPrice -
            downsideReference
          ) /
          entryPrice
        ) *
        100
      )
    );


  const targetAdjustmentPercent =
    roundPercent(
      boundedTargetChange *
      100
    );


  /*
   * Deprecated analytical component.
   *
   * Retained temporarily so the existing
   * UI contract does not break.
   */
  const valuationAdjustmentPercent =
    0;


  const verdict =
    getVerdict(
      potentialUpsidePercent,
      marginOfSafetyPercent,
      confidence
    );


  const drivers: string[] = [];

  const concerns: string[] = [];


  /*
   * Entry valuation.
   */
  if (
    valuationGapPercent >= 10
  ) {
    drivers.push(
      "The best available entry price is meaningfully below estimated fair value."
    );
  } else if (
    valuationGapPercent >= 3
  ) {
    drivers.push(
      "The best available entry price is modestly below estimated fair value."
    );
  } else if (
    valuationGapPercent <= -10
  ) {
    concerns.push(
      "The best available entry price is meaningfully above estimated fair value."
    );
  } else if (
    valuationGapPercent <= -3
  ) {
    concerns.push(
      "The best available entry price is modestly above estimated fair value."
    );
  }


  /*
   * Trend.
   */
  if (
    trendScore >= 65
  ) {
    drivers.push(
      "Positive price momentum supports a higher forward target."
    );
  } else if (
    trendScore <= 35
  ) {
    concerns.push(
      "Weak price momentum limits the forward target."
    );
  }


  /*
   * Risk.
   */
  if (
    riskScore <= 35
  ) {
    drivers.push(
      "Lower market risk supports the forward valuation."
    );
  } else if (
    riskScore >= 65
  ) {
    concerns.push(
      "Elevated market risk applies downward pressure to the target."
    );
  }


  /*
   * Margin of safety.
   */
  if (
    marginOfSafetyPercent >= 10
  ) {
    drivers.push(
      "The actionable entry price provides a meaningful margin of safety."
    );
  }


  /*
   * Confidence.
   */
  if (
    confidence === "Low"
  ) {
    concerns.push(
      "Limited market evidence reduces target confidence."
    );
  }


  if (
    confidence ===
    "Insufficient"
  ) {
    concerns.push(
      "There is not enough market evidence for a reliable target."
    );
  }


  return {
    referencePrice:
      referencePrice !== null &&
      referencePrice > 0
        ? roundCurrency(
            referencePrice
          )
        : null,

    entryPrice:
      roundCurrency(
        entryPrice
      ),

    fairValue:
      roundCurrency(
        fairValue
      ),

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