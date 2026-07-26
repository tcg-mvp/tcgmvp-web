import type {
  MarketStatisticsResult,
} from "@/lib/analytics/marketStatistics";

import type {
  TrendAnalysisResult,
} from "@/lib/analytics/trendAnalysis";

export type RiskLevel =
  | "Very Low"
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";

export type RiskAnalysisResult = {
  overallRisk: RiskLevel;
  riskScore: number;

  volatilityRisk: RiskLevel;
  liquidityRisk: RiskLevel;
  valuationRisk: RiskLevel;
  dataRisk: RiskLevel;

  reasons: string[];
};

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) {
    return "Very Low";
  }

  if (score <= 40) {
    return "Low";
  }

  if (score <= 60) {
    return "Moderate";
  }

  if (score <= 80) {
    return "High";
  }

  return "Very High";
}

function calculateVolatilityRisk(
  change30d: number | null,
  currentPrice: number | null,
  high52Week: number | null,
  low52Week: number | null
): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  let score = 25;
  const reasons: string[] = [];

  /*
   * Large price movements in either direction increase
   * short-term volatility risk.
   */

  if (change30d === null) {
    score += 20;

    reasons.push(
      "Insufficient 30-day price history increases uncertainty."
    );
  } else {
    const absoluteChange = Math.abs(change30d);

    if (absoluteChange >= 20) {
      score += 45;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1
        )}% over 30 days, indicating very high short-term volatility.`
      );
    } else if (absoluteChange >= 10) {
      score += 30;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1
        )}% over 30 days, indicating elevated volatility.`
      );
    } else if (absoluteChange >= 5) {
      score += 15;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1
        )}% over 30 days, indicating moderate volatility.`
      );
    } else if (absoluteChange >= 2) {
      score += 5;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1
        )}% over 30 days, indicating relatively stable movement.`
      );
    } else {
      score -= 10;

      reasons.push(
        `The price changed only ${absoluteChange.toFixed(
          1
        )}% over 30 days, indicating low short-term volatility.`
      );
    }
  }

  /*
   * A wide 52-week range suggests greater historical
   * price instability.
   */

  const hasValidRange =
    currentPrice !== null &&
    currentPrice > 0 &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;

  if (hasValidRange) {
    const rangeWidth =
      ((high52Week - low52Week) / currentPrice) * 100;

    if (rangeWidth >= 50) {
      score += 25;

      reasons.push(
        "The 52-week trading range is wide relative to the current price."
      );
    } else if (rangeWidth >= 30) {
      score += 15;

      reasons.push(
        "The 52-week trading range indicates moderate historical volatility."
      );
    } else if (rangeWidth >= 15) {
      score += 5;
    } else {
      score -= 5;

      reasons.push(
        "The 52-week trading range has remained relatively narrow."
      );
    }
  }

  const finalScore = clampScore(score);

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
    reason: reasons[0] ??
      "Available pricing data indicates moderate volatility.",
  };
}

function calculateLiquidityRisk(
  salesTracked: number,
  confidence: MarketStatisticsResult["confidence"]
): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  let score = 50;

  if (salesTracked >= 30) {
    score -= 35;
  } else if (salesTracked >= 20) {
    score -= 25;
  } else if (salesTracked >= 10) {
    score -= 15;
  } else if (salesTracked >= 5) {
    score -= 5;
  } else if (salesTracked > 0) {
    score += 15;
  } else {
    score += 35;
  }

  if (confidence === "High") {
    score -= 10;
  } else if (confidence === "Low") {
    score += 10;
  } else if (confidence === "Insufficient") {
    score += 20;
  }

  const finalScore = clampScore(score);

  let reason: string;

  if (salesTracked >= 20) {
    reason =
      `${salesTracked} tracked sales indicate strong market liquidity.`;
  } else if (salesTracked >= 10) {
    reason =
      `${salesTracked} tracked sales indicate reasonable market liquidity.`;
  } else if (salesTracked >= 5) {
    reason =
      `Only ${salesTracked} tracked sales are available, indicating limited liquidity evidence.`;
  } else if (salesTracked > 0) {
    reason =
      `Only ${salesTracked} recent ${
        salesTracked === 1 ? "sale is" : "sales are"
      } available, increasing liquidity risk.`;
  } else {
    reason =
      "No recent sales are available, creating significant liquidity uncertainty.";
  }

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
    reason,
  };
}

function calculateValuationRisk(
  currentPrice: number | null,
  high52Week: number | null,
  low52Week: number | null
): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  let score = 45;

  const hasValidRange =
    currentPrice !== null &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;

  if (!hasValidRange) {
    const finalScore = clampScore(score + 15);

    return {
      score: finalScore,
      level: getRiskLevel(finalScore),
      reason:
        "Insufficient range data makes the current valuation more difficult to assess.",
    };
  }

  const rangePosition =
    (currentPrice - low52Week) /
    (high52Week - low52Week);

  if (rangePosition >= 0.9) {
    score += 25;

    return {
      score: clampScore(score),
      level: getRiskLevel(clampScore(score)),
      reason:
        "The product is trading near its 52-week high, increasing price-entry risk.",
    };
  }

  if (rangePosition >= 0.7) {
    score += 12;

    return {
      score: clampScore(score),
      level: getRiskLevel(clampScore(score)),
      reason:
        "The product is trading in the upper portion of its 52-week range.",
    };
  }

  if (rangePosition >= 0.35) {
    score -= 5;

    return {
      score: clampScore(score),
      level: getRiskLevel(clampScore(score)),
      reason:
        "The product is trading near the middle of its 52-week range.",
    };
  }

  if (rangePosition >= 0.1) {
    score -= 15;

    return {
      score: clampScore(score),
      level: getRiskLevel(clampScore(score)),
      reason:
        "The product is trading in the lower portion of its 52-week range.",
    };
  }

  score -= 20;

  return {
    score: clampScore(score),
    level: getRiskLevel(clampScore(score)),
    reason:
      "The product is trading near its 52-week low, reducing price-entry risk.",
  };
}

function calculateDataRisk(
  confidence: MarketStatisticsResult["confidence"],
  salesTracked: number
): {
  score: number;
  level: RiskLevel;
  reason: string;
} {
  let score: number;

  switch (confidence) {
    case "High":
      score = 15;
      break;

    case "Medium":
      score = 35;
      break;

    case "Low":
      score = 65;
      break;

    case "Insufficient":
      score = 90;
      break;
  }

  const finalScore = clampScore(score);

  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
    reason:
      confidence === "High"
        ? `High-confidence data is supported by ${salesTracked} tracked sales and sufficient price history.`
        : confidence === "Medium"
          ? `Available market data provides moderate confidence in the analysis.`
          : confidence === "Low"
            ? `Only ${salesTracked} tracked ${
                salesTracked === 1 ? "sale is" : "sales are"
              } available, increasing data risk.`
            : "The available data is insufficient for a dependable market assessment.",
  };
}

export function calculateRiskAnalysis(
  statistics: MarketStatisticsResult,
  trendAnalysis: TrendAnalysisResult
): RiskAnalysisResult {
  const {
    currentPrice,
    change30d,
    high52Week,
    low52Week,
    salesTracked,
    confidence,
  } = statistics;

  const volatility = calculateVolatilityRisk(
    change30d,
    currentPrice,
    high52Week,
    low52Week
  );

  const liquidity = calculateLiquidityRisk(
    salesTracked,
    confidence
  );

  const valuation = calculateValuationRisk(
    currentPrice,
    high52Week,
    low52Week
  );

  const data = calculateDataRisk(
    confidence,
    salesTracked
  );

  /*
   * Weighted overall risk:
   *
   * Volatility: 30%
   * Liquidity: 25%
   * Valuation: 25%
   * Data quality: 20%
   */

  let weightedRisk =
    volatility.score * 0.3 +
    liquidity.score * 0.25 +
    valuation.score * 0.25 +
    data.score * 0.2;

  /*
   * A strongly negative trend adds a small risk premium.
   * A positive trend does not automatically reduce risk.
   */

  if (
    trendAnalysis.trend === "Very Bearish"
  ) {
    weightedRisk += 10;
  } else if (
    trendAnalysis.trend === "Bearish"
  ) {
    weightedRisk += 5;
  }

  const riskScore = clampScore(weightedRisk);

  const reasons = [
    volatility.reason,
    liquidity.reason,
    valuation.reason,
    data.reason,
  ];

  return {
    overallRisk: getRiskLevel(riskScore),
    riskScore,

    volatilityRisk: volatility.level,
    liquidityRisk: liquidity.level,
    valuationRisk: valuation.level,
    dataRisk: data.level,

    reasons,
  };
}