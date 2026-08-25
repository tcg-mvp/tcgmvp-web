import type {
  TrendAnalysisResult,
} from "@/lib/analytics/trendAnalysis";

import type {
  RiskAnalysisResult,
} from "@/lib/analytics/riskAnalysis";

import type {
  FairValueResult,
} from "@/lib/analytics/fairValue";

import type {
  MarketHealthResult,
} from "@/lib/analytics/marketHealth";


export type MarketRatingLabel =
  | "Exceptional"
  | "Strong"
  | "Favorable"
  | "Neutral"
  | "Weak"
  | "Very Weak";


export type MarketRatingConfidence =
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";


export type MarketRatingInput = {
  /**
   * Lowest actionable eligible active listing.
   *
   * Used for the valuation component because
   * Market Rating evaluates how attractive the
   * market is to a buyer right now.
   */
  entryPrice: number | null;

  trendAnalysis:
    TrendAnalysisResult;

  riskAnalysis:
    RiskAnalysisResult;

  fairValue:
    FairValueResult;

  marketHealth:
    MarketHealthResult;

  /**
   * Shared Market Confidence generated
   * by confidence.ts.
   */
  marketConfidenceScore: number;

  marketConfidence:
    MarketRatingConfidence;
};


export type MarketRatingResult = {
  ratingScore: number;

  rating:
    MarketRatingLabel;

  stars: number;

  confidenceScore: number;

  confidence:
    MarketRatingConfidence;

  trendScore: number;

  riskAdjustedScore: number;

  /**
   * Null means transaction-supported Fair Value
   * is unavailable, so valuation is excluded
   * from Market Rating rather than treated as
   * neutral or poor.
   */
  valuationScore: number | null;

  marketHealthScore: number | null;

  valuationDifferencePercent:
    number | null;

  summary: string;

  strengths: string[];

  concerns: string[];
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


function roundScore(
  value: number
): number {
  return Math.round(
    clamp(
      value
    )
  );
}


function getRatingLabel(
  score: number
): MarketRatingLabel {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 80) {
    return "Strong";
  }

  if (score >= 68) {
    return "Favorable";
  }

  if (score >= 52) {
    return "Neutral";
  }

  if (score >= 35) {
    return "Weak";
  }

  return "Very Weak";
}


function getStarRating(
  score: number
): number {
  if (score >= 90) {
    return 5;
  }

  if (score >= 80) {
    return 4;
  }

  if (score >= 68) {
    return 3.5;
  }

  if (score >= 52) {
    return 3;
  }

  if (score >= 35) {
    return 2;
  }

  return 1;
}


function calculateValuationScore(
  entryPrice: number | null,
  fairValue: number | null
): {
  score: number | null;
  differencePercent: number | null;
} {
  /*
   * Valuation is unavailable unless both the
   * actionable entry price and transaction-supported
   * TCGMVP Fair Value are available.
   *
   * Missing valuation evidence must not be converted
   * into an artificial neutral score.
   */
  if (
    entryPrice === null ||
    entryPrice <= 0 ||
    fairValue === null ||
    fairValue <= 0
  ) {
    return {
      score: null,
      differencePercent: null,
    };
  }


  const differencePercent =
    (
      (
        fairValue -
        entryPrice
      ) /
      fairValue
    ) *
    100;


  /*
   * Positive difference:
   * entry price is below Fair Value.
   *
   * Negative difference:
   * entry price is above Fair Value.
   */
  let score: number;


  if (
    differencePercent >= 20
  ) {
    score = 95;
  } else if (
    differencePercent >= 10
  ) {
    score = 85;
  } else if (
    differencePercent >= 3
  ) {
    score = 72;
  } else if (
    differencePercent > -3
  ) {
    score = 60;
  } else if (
    differencePercent > -10
  ) {
    score = 45;
  } else if (
    differencePercent > -20
  ) {
    score = 30;
  } else {
    score = 15;
  }


  return {
    score,
    differencePercent,
  };
}


function buildStrengths({
  trendAnalysis,
  riskAnalysis,
  fairValue,
  marketHealth,
  valuationDifferencePercent,
}: {
  trendAnalysis:
    TrendAnalysisResult;

  riskAnalysis:
    RiskAnalysisResult;

  fairValue:
    FairValueResult;

  marketHealth:
    MarketHealthResult;

  valuationDifferencePercent:
    number | null;
}): string[] {
  const strengths: string[] = [];


  if (
    trendAnalysis.trend ===
      "Very Bullish" ||
    trendAnalysis.trend ===
      "Bullish"
  ) {
    strengths.push(
      `${trendAnalysis.trend} market trend with ${trendAnalysis.momentum.toLowerCase()} momentum.`
    );
  }


  if (
    riskAnalysis.overallRisk ===
      "Very Low" ||
    riskAnalysis.overallRisk ===
      "Low"
  ) {
    strengths.push(
      `${riskAnalysis.overallRisk} overall market risk.`
    );
  }


  if (
    marketHealth.label ===
      "Strong" ||
    marketHealth.label ===
      "Healthy"
  ) {
    strengths.push(
      `${marketHealth.label} underlying market conditions.`
    );
  }


  if (
    valuationDifferencePercent !==
      null &&
    valuationDifferencePercent >=
      3
  ) {
    strengths.push(
      `The best available entry price is ${valuationDifferencePercent.toFixed(
        1
      )}% below estimated fair value.`
    );
  } else if (
    valuationDifferencePercent !==
      null &&
    valuationDifferencePercent >
      -3
  ) {
    strengths.push(
      "The best available entry price is trading near estimated fair value."
    );
  }


  if (
    fairValue.salesCount >= 20 &&
    strengths.length < 4
  ) {
    strengths.push(
      `${fairValue.salesCount} verified recent sales support the valuation estimate.`
    );
  }


  return strengths.slice(
    0,
    4
  );
}


function buildConcerns({
  trendAnalysis,
  riskAnalysis,
  fairValue,
  marketHealth,
  valuationDifferencePercent,
}: {
  trendAnalysis:
    TrendAnalysisResult;

  riskAnalysis:
    RiskAnalysisResult;

  fairValue:
    FairValueResult;

  marketHealth:
    MarketHealthResult;

  valuationDifferencePercent:
    number | null;
}): string[] {
  const concerns: string[] = [];


  if (
    trendAnalysis.trend ===
      "Bearish" ||
    trendAnalysis.trend ===
      "Very Bearish"
  ) {
    concerns.push(
      `${trendAnalysis.trend} market trend with ${trendAnalysis.momentum.toLowerCase()} momentum.`
    );
  }


  if (
    riskAnalysis.overallRisk ===
      "High" ||
    riskAnalysis.overallRisk ===
      "Very High"
  ) {
    concerns.push(
      `${riskAnalysis.overallRisk} overall market risk.`
    );
  } else if (
    riskAnalysis.overallRisk ===
      "Moderate"
  ) {
    concerns.push(
      "Moderate risk may limit the strength of the overall rating."
    );
  }


  if (
    valuationDifferencePercent !==
      null &&
    valuationDifferencePercent <=
      -10
  ) {
    concerns.push(
      `The best available entry price is ${Math.abs(
        valuationDifferencePercent
      ).toFixed(
        1
      )}% above estimated fair value.`
    );
  } else if (
    valuationDifferencePercent !==
      null &&
    valuationDifferencePercent <=
      -3
  ) {
    concerns.push(
      "The best available entry price is moderately above estimated fair value."
    );
  }


  if (
    marketHealth.label ===
      "Weak"
  ) {
    concerns.push(
      "Weak underlying market health reduces rating quality."
    );
  } else if (
    marketHealth.label ===
      "Mixed"
  ) {
    concerns.push(
      "Underlying market conditions remain mixed."
    );
  }


  if (
    fairValue.salesCount === 0
  ) {
    concerns.push(
      "No verified recent sales are available, so valuation is excluded from the Market Rating."
    );
  } else if (
    fairValue.salesCount < 5
  ) {
    concerns.push(
      `Only ${fairValue.salesCount} verified recent ${
        fairValue.salesCount === 1
          ? "sale is"
          : "sales are"
      } available to support the valuation.`
    );
  }


  return concerns.slice(
    0,
    4
  );
}


function buildSummary(
  rating:
    MarketRatingLabel,

  confidence:
    MarketRatingConfidence,

  trendAnalysis:
    TrendAnalysisResult,

  riskAnalysis:
    RiskAnalysisResult,

  valuationAvailable:
    boolean
): string {
  const ratingSummary: Record<
    MarketRatingLabel,
    string
  > = {
    Exceptional:
      "The product demonstrates exceptional overall market characteristics.",

    Strong:
      "The product demonstrates strong overall market characteristics.",

    Favorable:
      "The product presents generally favorable market characteristics.",

    Neutral:
      "The product presents a balanced market profile without a decisive advantage.",

    Weak:
      "The product currently presents below-average market characteristics.",

    "Very Weak":
      "The product currently presents materially weak market characteristics.",
  };


  const confidenceText =
    confidence === "High"
      ? (
          "The assessment is supported by " +
          "high-confidence market evidence."
        )
      : confidence === "Medium"
        ? (
            "The assessment is supported by " +
            "a moderate amount of market evidence."
          )
        : confidence === "Low"
          ? (
              "The assessment should be interpreted " +
              "cautiously because the supporting " +
              "market evidence is limited."
            )
          : (
              "There is not enough dependable " +
              "market evidence to treat this rating " +
              "as conclusive."
            );


  const valuationText =
    valuationAvailable
      ? ""
      : (
          " Valuation is excluded from this rating " +
          "because transaction-supported Fair Value " +
          "is currently unavailable."
        );


  return (
    `${ratingSummary[rating]} ` +
    `The current trend is ${trendAnalysis.trend.toLowerCase()}, ` +
    `while overall risk is ${riskAnalysis.overallRisk.toLowerCase()}. ` +
    confidenceText +
    valuationText
  );
}


export function calculateMarketRating({
  entryPrice,
  trendAnalysis,
  riskAnalysis,
  fairValue,
  marketHealth,
  marketConfidenceScore,
  marketConfidence,
}: MarketRatingInput): MarketRatingResult {
  const trendScore =
    roundScore(
      trendAnalysis.strength
    );


  /*
   * Risk scores increase as risk becomes worse.
   *
   * Invert the score because a Market Rating
   * should reward lower risk.
   */
  const riskAdjustedScore =
    roundScore(
      100 -
      riskAnalysis.riskScore
    );


  const marketHealthScore =
    marketHealth.score === null
      ? null
      : roundScore(
          marketHealth.score
        );


  /*
   * Valuation is based on the actionable
   * entry price and transaction-supported
   * TCGMVP Fair Value.
   */
  const valuation =
    calculateValuationScore(
      entryPrice,
      fairValue.fairValue
    );


  const valuationScore =
    valuation.score === null
      ? null
      : roundScore(
          valuation.score
        );


  /*
   * --------------------------------------------------
   * TCGMVP MARKET RATING
   * --------------------------------------------------
   *
   * Answers:
   *
   * "How attractive is this product's market
   * right now?"
   *
   * Standard weighting:
   *
   * Trend:          25%
   * Market Health:  30%
   * Risk:           25%
   * Valuation:      20%
   *
   * If valuation is unavailable, it is excluded
   * rather than assigned an artificial score.
   *
   * The remaining available weights are then
   * normalized back to 100%.
   *
   * This prevents missing transaction evidence
   * from either rewarding or penalizing a product.
   *
   * Confidence remains separate from rating quality.
   */
  const trendWeight =
    0.25;

  const marketHealthWeight =
    marketHealthScore === null
      ? 0
      : 0.30;

  const riskWeight =
    0.25;

  const valuationWeight =
    valuationScore === null
      ? 0
      : 0.20;


  const totalAvailableWeight =
    trendWeight +
    marketHealthWeight +
    riskWeight +
    valuationWeight;


  const weightedScore =
    trendScore * trendWeight +
    (
      marketHealthScore === null
        ? 0
        : marketHealthScore *
          marketHealthWeight
    ) +
    riskAdjustedScore *
      riskWeight +
    (
      valuationScore === null
        ? 0
        : valuationScore *
          valuationWeight
    );


  const rawRatingScore =
    weightedScore /
    totalAvailableWeight;


  const ratingScore =
    roundScore(
      rawRatingScore
    );


  const rating =
    getRatingLabel(
      ratingScore
    );


  const stars =
    getStarRating(
      ratingScore
    );


  /*
   * Shared Market Confidence.
   */
  const confidenceScore =
    roundScore(
      marketConfidenceScore
    );


  const confidence =
    marketConfidence;


  const strengths =
    buildStrengths({
      trendAnalysis,

      riskAnalysis,

      fairValue,

      marketHealth,

      valuationDifferencePercent:
        valuation.differencePercent,
    });


  const concerns =
    buildConcerns({
      trendAnalysis,

      riskAnalysis,

      fairValue,

      marketHealth,

      valuationDifferencePercent:
        valuation.differencePercent,
    });


  return {
    ratingScore,

    rating,

    stars,

    confidenceScore,

    confidence,

    trendScore,

    riskAdjustedScore,

    valuationScore,

    marketHealthScore,

    valuationDifferencePercent:
      valuation.differencePercent,

    summary:
      buildSummary(
        rating,
        confidence,
        trendAnalysis,
        riskAnalysis,
        valuationScore !== null
      ),

    strengths,

    concerns,
  };
}