import type {
  MarketStatisticsResult,
} from "@/lib/analytics/marketStatistics";

import type {
  ConfidenceLevel,
  ConfidenceResult,
} from "@/lib/analytics/confidence";


export type TrendDirection =
  | "Very Bullish"
  | "Bullish"
  | "Neutral"
  | "Bearish"
  | "Very Bearish";


export type TrendMomentum =
  | "Strong Positive"
  | "Positive"
  | "Slightly Positive"
  | "Stable"
  | "Slightly Negative"
  | "Negative"
  | "Strong Negative";


export type TrendConfidence =
  ConfidenceLevel;


export type TrendAnalysisResult = {
  /**
   * Directional interpretation of the market.
   */
  trend: TrendDirection;

  /**
   * Plain-language interpretation of recent
   * price momentum.
   */
  momentum: TrendMomentum;

  /**
   * Directional strength score from 0–100.
   *
   * Higher = more bullish.
   *
   * Confidence does NOT alter this score.
   */
  strength: number;

  /**
   * Shared evidence confidence from
   * confidence.ts.
   */
  confidence: TrendConfidence;

  /**
   * Shared evidence-confidence score.
   */
  confidenceScore: number;

  /**
   * Number of verified recent sales used
   * as confirmation evidence.
   */
  salesTracked: number;

  reasons: string[];
};


function clampScore(
  score: number,
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(score),
    ),
  );
}


function getTrendLabel(
  score: number,
): TrendDirection {
  if (score >= 80) {
    return "Very Bullish";
  }

  if (score >= 65) {
    return "Bullish";
  }

  if (score >= 45) {
    return "Neutral";
  }

  if (score >= 25) {
    return "Bearish";
  }

  return "Very Bearish";
}


function getMomentum(
  change30d: number | null,
): TrendMomentum {
  if (change30d === null) {
    return "Stable";
  }

  if (change30d >= 10) {
    return "Strong Positive";
  }

  if (change30d >= 3) {
    return "Positive";
  }

  if (change30d >= 0.5) {
    return "Slightly Positive";
  }

  if (change30d > -0.5) {
    return "Stable";
  }

  if (change30d > -3) {
    return "Slightly Negative";
  }

  if (change30d > -10) {
    return "Negative";
  }

  return "Strong Negative";
}


function getConfidenceReason(
  confidence: ConfidenceResult,
  salesTracked: number,
): string {
  switch (confidence.confidence) {
    case "High":
      return (
        `High-confidence market evidence supports this trend assessment ` +
        `(${confidence.score}/100 confidence; ${salesTracked} verified recent sales).`
      );

    case "Medium":
      return (
        `Moderate-confidence market evidence supports this trend assessment ` +
        `(${confidence.score}/100 confidence).`
      );

    case "Low":
      return (
        `The directional signal is supported by limited market evidence ` +
        `(${confidence.score}/100 confidence).`
      );

    case "Insufficient":
      return (
        "The directional calculation is available, but market evidence " +
        "is insufficient to treat the trend as dependable."
      );
  }
}


export function calculateTrendAnalysis(
  statistics: MarketStatisticsResult,
  marketConfidence: ConfidenceResult,
): TrendAnalysisResult {
  /*
   * Trend starts from neutral.
   *
   * 50 = neutral
   * >50 = increasingly bullish
   * <50 = increasingly bearish
   */
  let score = 50;


  const positiveReasons: string[] = [];
  const neutralReasons: string[] = [];
  const cautionReasons: string[] = [];


  const {
    currentPrice,
    change30d,
    high52Week,
    low52Week,
    salesTracked,
  } = statistics;


  /*
  |--------------------------------------------------------------------------
  | 1. 30-day price momentum
  |--------------------------------------------------------------------------
  |
  | Primary directional signal.
  |
  | Sales activity and confidence do NOT make
  | the direction more bullish or bearish.
  |
  */

  if (change30d !== null) {
    if (change30d >= 10) {
      score += 20;

      positiveReasons.push(
        `Price increased ${change30d.toFixed(
          1,
        )}% over the last 30 days, indicating strong positive momentum.`,
      );
    } else if (
      change30d >= 3
    ) {
      score += 12;

      positiveReasons.push(
        `Price increased ${change30d.toFixed(
          1,
        )}% over the last 30 days.`,
      );
    } else if (
      change30d >= 0.5
    ) {
      score += 5;

      positiveReasons.push(
        `Price increased modestly by ${change30d.toFixed(
          1,
        )}% over the last 30 days.`,
      );
    } else if (
      change30d > -0.5
    ) {
      neutralReasons.push(
        "Price remained essentially unchanged over the last 30 days.",
      );
    } else if (
      change30d > -3
    ) {
      score -= 5;

      cautionReasons.push(
        `Price declined modestly by ${Math.abs(
          change30d,
        ).toFixed(
          1,
        )}% over the last 30 days.`,
      );
    } else if (
      change30d > -10
    ) {
      score -= 12;

      cautionReasons.push(
        `Price declined ${Math.abs(
          change30d,
        ).toFixed(
          1,
        )}% over the last 30 days.`,
      );
    } else {
      score -= 20;

      cautionReasons.push(
        `Price declined ${Math.abs(
          change30d,
        ).toFixed(
          1,
        )}% over the last 30 days, indicating strong negative momentum.`,
      );
    }
  } else {
    cautionReasons.push(
      "There is not enough price history to calculate 30-day momentum.",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 2. Position within the 52-week range
  |--------------------------------------------------------------------------
  |
  | Secondary directional/context signal.
  |
  | A product near its high is showing stronger
  | relative price positioning than one near its low.
  |
  */

  const hasValidRange =
    currentPrice !== null &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;


  if (hasValidRange) {
    const rangePosition =
      (
        currentPrice -
        low52Week
      ) /
      (
        high52Week -
        low52Week
      );


    if (rangePosition >= 0.9) {
      score += 12;

      positiveReasons.push(
        "The current price is trading near its 52-week high.",
      );
    } else if (
      rangePosition >= 0.65
    ) {
      score += 7;

      positiveReasons.push(
        "The current price is trading in the upper portion of its 52-week range.",
      );
    } else if (
      rangePosition >= 0.35
    ) {
      neutralReasons.push(
        "The current price is near the middle of its 52-week range.",
      );
    } else if (
      rangePosition >= 0.1
    ) {
      score -= 7;

      cautionReasons.push(
        "The current price is trading in the lower portion of its 52-week range.",
      );
    } else {
      score -= 12;

      cautionReasons.push(
        "The current price is trading near its 52-week low.",
      );
    }
  } else if (
    currentPrice !== null &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week === low52Week
  ) {
    neutralReasons.push(
      "The available history does not yet provide a meaningful 52-week trading range.",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 3. Transaction confirmation
  |--------------------------------------------------------------------------
  |
  | Sales activity confirms how representative the
  | observed trend may be.
  |
  | It intentionally does NOT change the directional
  | score itself.
  |
  */

  if (salesTracked >= 20) {
    positiveReasons.push(
      `${salesTracked} verified recent sales provide deep transaction confirmation of current market behavior.`,
    );
  } else if (
    salesTracked >= 10
  ) {
    positiveReasons.push(
      `${salesTracked} verified recent sales provide meaningful transaction confirmation.`,
    );
  } else if (
    salesTracked >= 5
  ) {
    neutralReasons.push(
      `${salesTracked} verified recent sales are available, though additional transactions would strengthen trend confirmation.`,
    );
  } else if (
    salesTracked > 0
  ) {
    cautionReasons.push(
      `Only ${salesTracked} verified recent ${
        salesTracked === 1
          ? "sale is"
          : "sales are"
      } available to confirm the trend.`,
    );
  } else {
    cautionReasons.push(
      "No verified recent sales are available to confirm the current trend.",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 4. Shared Market Confidence
  |--------------------------------------------------------------------------
  |
  | Confidence describes the reliability of the trend.
  |
  | It does NOT increase or decrease bullishness.
  |
  | Example:
  |
  | Bearish trend + High Confidence
  |
  | is perfectly valid and means:
  |
  | "The market is declining and we have strong evidence
  | supporting that conclusion."
  |
  */

  const strength =
    clampScore(
      score,
    );


  const confidenceReason =
    getConfidenceReason(
      marketConfidence,
      salesTracked,
    );


  /*
   * Prioritize directional reasons first, then
   * confirmation/confidence context.
   */
  const reasons = [
    ...positiveReasons,
    ...neutralReasons,
    ...cautionReasons,
  ];


  if (
    !reasons.includes(
      confidenceReason,
    )
  ) {
    reasons.push(
      confidenceReason,
    );
  }


  return {
    trend:
      getTrendLabel(
        strength,
      ),

    momentum:
      getMomentum(
        change30d,
      ),

    strength,

    confidence:
      marketConfidence.confidence,

    confidenceScore:
      marketConfidence.score,

    salesTracked,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}