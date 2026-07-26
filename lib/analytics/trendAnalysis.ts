import type {
  MarketStatisticsResult,
} from "@/lib/analytics/marketStatistics";

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
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";

export type TrendAnalysisResult = {
  trend: TrendDirection;
  momentum: TrendMomentum;
  strength: number;
  confidence: TrendConfidence;
  salesTracked: number;
  reasons: string[];
};

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getTrendLabel(score: number): TrendDirection {
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
  change30d: number | null
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
  confidence: TrendConfidence,
  salesTracked: number
): string {
  switch (confidence) {
    case "High":
      return `High confidence based on ${salesTracked} tracked sales and sufficient price history.`;

    case "Medium":
      return `Moderate confidence based on ${salesTracked} tracked sales and available price history.`;

    case "Low":
      return `Confidence is limited because only ${salesTracked} tracked ${
        salesTracked === 1 ? "sale is" : "sales are"
      } currently available.`;

    case "Insufficient":
      return "There is not enough market data to confirm the current trend.";
  }
}

export function calculateTrendAnalysis(
  statistics: MarketStatisticsResult
): TrendAnalysisResult {
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
    confidence,
  } = statistics;

  /*
   * 30-day price momentum
   */

  if (change30d !== null) {
    if (change30d >= 10) {
      score += 20;

      positiveReasons.push(
        `Price increased ${change30d.toFixed(
          1
        )}% over the last 30 days, indicating strong momentum.`
      );
    } else if (change30d >= 3) {
      score += 12;

      positiveReasons.push(
        `Price increased ${change30d.toFixed(
          1
        )}% over the last 30 days.`
      );
    } else if (change30d >= 0.5) {
      score += 5;

      positiveReasons.push(
        `Price increased modestly by ${change30d.toFixed(
          1
        )}% over the last 30 days.`
      );
    } else if (change30d > -0.5) {
      neutralReasons.push(
        "Price remained essentially unchanged over the last 30 days."
      );
    } else if (change30d > -3) {
      score -= 5;

      cautionReasons.push(
        `Price declined modestly by ${Math.abs(change30d).toFixed(
          1
        )}% over the last 30 days.`
      );
    } else if (change30d > -10) {
      score -= 12;

      cautionReasons.push(
        `Price declined ${Math.abs(change30d).toFixed(
          1
        )}% over the last 30 days.`
      );
    } else {
      score -= 20;

      cautionReasons.push(
        `Price declined ${Math.abs(change30d).toFixed(
          1
        )}% over the last 30 days, indicating strong negative momentum.`
      );
    }
  } else {
    cautionReasons.push(
      "There is not enough price history to calculate 30-day momentum."
    );
  }

  /*
   * Position within the 52-week range
   */

  const hasValidRange =
    currentPrice !== null &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;

  if (hasValidRange) {
    const rangePosition =
      (currentPrice - low52Week) /
      (high52Week - low52Week);

    if (rangePosition >= 0.9) {
      score += 12;

      positiveReasons.push(
        "The current price is trading near its 52-week high."
      );
    } else if (rangePosition >= 0.65) {
      score += 7;

      positiveReasons.push(
        "The current price is trading in the upper portion of its 52-week range."
      );
    } else if (rangePosition >= 0.35) {
      neutralReasons.push(
        "The current price is near the middle of its 52-week range."
      );
    } else if (rangePosition >= 0.1) {
      score -= 7;

      cautionReasons.push(
        "The current price is trading in the lower portion of its 52-week range."
      );
    } else {
      score -= 12;

      cautionReasons.push(
        "The current price is trading near its 52-week low."
      );
    }
  } else if (
    currentPrice !== null &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week === low52Week
  ) {
    neutralReasons.push(
      "The available price history does not yet provide a meaningful 52-week range."
    );
  }

  /*
   * Sales activity
   *
   * Sales volume affects confidence more than direction.
   * A high number of sales confirms a trend but does not
   * automatically mean the trend is bullish.
   */

  if (salesTracked >= 20) {
    score += 6;

    positiveReasons.push(
      `${salesTracked} tracked sales provide strong confirmation of current market pricing.`
    );
  } else if (salesTracked >= 10) {
    score += 4;

    positiveReasons.push(
      `${salesTracked} tracked sales provide reasonable confirmation of current market pricing.`
    );
  } else if (salesTracked >= 5) {
    score += 1;

    neutralReasons.push(
      `${salesTracked} recent sales are available, but additional sales would improve confidence.`
    );
  } else if (salesTracked > 0) {
    cautionReasons.push(
      `Only ${salesTracked} recent ${
        salesTracked === 1 ? "sale is" : "sales are"
      } available to confirm the trend.`
    );
  } else {
    score -= 5;

    cautionReasons.push(
      "No recent sales are available to confirm the current trend."
    );
  }

  /*
   * Data-confidence adjustment
   */

  if (confidence === "High") {
    score += 4;
  } else if (confidence === "Low") {
    score -= 2;
  } else if (confidence === "Insufficient") {
    score -= 7;
  }

  const strength = clampScore(score);

  const reasons = [
    ...positiveReasons,
    ...neutralReasons,
    ...cautionReasons,
  ];

  const confidenceReason = getConfidenceReason(
    confidence,
    salesTracked
  );

  if (!reasons.includes(confidenceReason)) {
    reasons.push(confidenceReason);
  }

    return {
    trend: getTrendLabel(strength),
    momentum: getMomentum(change30d),
    strength,
    confidence,
    salesTracked,
    reasons: reasons.slice(0, 4),
    };
}