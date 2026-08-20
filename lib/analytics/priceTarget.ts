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
   * Expected range: 0–100.
   * Higher means stronger positive trend.
   */
  trendScore: number;

  /**
   * Expected range: 0–100.
   * Higher means greater risk.
   */
  riskScore: number;

  /**
   * Expected range: 0–100.
   * Higher means healthier market structure.
   */
  marketHealthScore: number;

  /**
   * Expected range: 0–100.
   * Higher means stronger investment quality.
   */
  investmentGradeScore: number;

  /**
   * Shared Market Confidence generated
   * by confidence.ts.
   */
  marketConfidenceScore: number;

  marketConfidence:
    PriceTargetConfidence;
};


export type PriceTargetResult = {
  currentPrice: number | null;

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
   * Retained for compatibility with the
   * existing UI/type contract.
   *
   * Valuation is no longer applied as an
   * additional target-price adjustment,
   * because Fair Value is already the
   * target model's starting point.
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
    currentPrice,
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
        "A valid current price and fair value are required.",
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


  const marketHealthScore =
    clamp(
      input.marketHealthScore,
      0,
      100
    );


  const investmentGradeScore =
    clamp(
      input.investmentGradeScore,
      0,
      100
    );


  /*
   * Current valuation gap.
   *
   * Positive:
   * current price is below Fair Value.
   *
   * Negative:
   * current price is above Fair Value.
   *
   * This is used for entry-value analysis
   * and verdict generation.
   *
   * It does NOT directly increase or
   * decrease the forward target, because
   * Fair Value is already the target's
   * starting valuation anchor.
   */
  const valuationGapPercent =
    (
      (
        fairValue -
        currentPrice
      ) /
      fairValue
    ) *
    100;


  /*
   * Forward target adjustments.
   *
   * Each factor is centered around 50.
   *
   * Trend:
   * approximately ±10%
   *
   * Market Health:
   * approximately ±6%
   *
   * Investment Grade:
   * approximately ±6%
   *
   * Risk:
   * approximately ±10%
   */
  const trendAdjustment =
    (
      (
        trendScore -
        50
      ) /
      50
    ) *
    0.10;


  const marketHealthAdjustment =
    (
      (
        marketHealthScore -
        50
      ) /
      50
    ) *
    0.06;


  const investmentGradeAdjustment =
    (
      (
        investmentGradeScore -
        50
      ) /
      50
    ) *
    0.06;


  const riskAdjustment =
    -(
      (
        riskScore -
        50
      ) /
      50
    ) *
    0.10;


  /*
   * Fair Value already captures present
   * valuation, so the forward adjustment
   * contains only forward-looking market,
   * quality, and risk factors.
   */
  const rawAdjustment =
    trendAdjustment +
    marketHealthAdjustment +
    investmentGradeAdjustment +
    riskAdjustment;


  /*
   * Lower-confidence targets remain closer
   * to present Fair Value.
   */
  const confidenceMultiplier =
    confidence === "High"
      ? 1
      : confidence === "Medium"
        ? 0.75
        : confidence === "Low"
          ? 0.45
          : 0.20;


  const adjustedTargetChange =
    rawAdjustment *
    confidenceMultiplier;


  /*
   * Safety bounds for the initial target
   * model.
   *
   * These prevent individual analytics
   * components from producing extreme
   * forward valuations.
   */
  const boundedTargetChange =
    clamp(
      adjustedTargetChange,
      -0.18,
      0.22
    );


  const targetPrice =
    roundCurrency(
      fairValue *
      (
        1 +
        boundedTargetChange
      )
    );


  const potentialUpsidePercent =
    roundPercent(
      (
        (
          targetPrice -
          currentPrice
        ) /
        currentPrice
      ) *
      100
    );


  const marginOfSafetyPercent =
    roundPercent(
      valuationGapPercent
    );


  /*
   * Downside reference uses the more
   * conservative of Fair Value and the
   * forward target.
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
            currentPrice -
            downsideReference
          ) /
          currentPrice
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
   * No separate valuation adjustment is
   * applied anymore.
   *
   * Retained as zero so existing UI code
   * does not break.
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
      "The current price is meaningfully below estimated fair value."
    );
  } else if (
    valuationGapPercent >= 3
  ) {
    drivers.push(
      "The current price is modestly below estimated fair value."
    );
  } else if (
    valuationGapPercent <= -10
  ) {
    concerns.push(
      "The current price is meaningfully above estimated fair value."
    );
  } else if (
    valuationGapPercent <= -3
  ) {
    concerns.push(
      "The current price is modestly above estimated fair value."
    );
  }


  /*
   * Trend.
   */
  if (
    trendScore >= 65
  ) {
    drivers.push(
      "Positive market trend supports a higher forward target."
    );
  } else if (
    trendScore <= 35
  ) {
    concerns.push(
      "Weak market momentum limits the forward target."
    );
  }


  /*
   * Market health.
   */
  if (
    marketHealthScore >= 65
  ) {
    drivers.push(
      "Healthy liquidity and market structure support pricing."
    );
  } else if (
    marketHealthScore <= 35
  ) {
    concerns.push(
      "Weak market health reduces target reliability."
    );
  }


  /*
   * Investment quality.
   */
  if (
    investmentGradeScore >= 65
  ) {
    drivers.push(
      "Strong investment quality supports longer-term demand."
    );
  } else if (
    investmentGradeScore <= 35
  ) {
    concerns.push(
      "Low investment quality limits appreciation potential."
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
      "The current price provides a meaningful margin of safety."
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
    currentPrice:
      roundCurrency(
        currentPrice
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