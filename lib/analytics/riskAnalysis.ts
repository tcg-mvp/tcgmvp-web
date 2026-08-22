import type {
  MarketStatisticsResult,
} from "@/lib/analytics/marketStatistics";

import type {
  TrendAnalysisResult,
} from "@/lib/analytics/trendAnalysis";

import type {
  ConfidenceResult,
} from "@/lib/analytics/confidence";


export type RiskLevel =
  | "Very Low"
  | "Low"
  | "Moderate"
  | "High"
  | "Very High";


export type RiskAnalysisInput = {
  statistics: MarketStatisticsResult;

  trendAnalysis: TrendAnalysisResult;

  marketConfidence: ConfidenceResult;

  /**
   * TCGMVP estimated Fair Value.
   */
  fairValue: number | null;

  /**
   * Lowest actionable eligible active listing.
   *
   * This is used for valuation risk because it
   * represents the price a buyer can actually
   * enter the market at.
   */
  entryPrice: number | null;

  activeListingsCount: number;
};


export type RiskAnalysisResult = {
  overallRisk: RiskLevel;

  riskScore: number;

  volatilityRisk: RiskLevel;

  liquidityRisk: RiskLevel;

  valuationRisk: RiskLevel;

  dataRisk: RiskLevel;

  volatilityRiskScore: number;

  liquidityRiskScore: number;

  valuationRiskScore: number;

  dataRiskScore: number;

  reasons: string[];
};


function clampScore(
  score: number,
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        score,
      ),
    ),
  );
}


function getRiskLevel(
  score: number,
): RiskLevel {
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


/*
|--------------------------------------------------------------------------
| Volatility Risk
|--------------------------------------------------------------------------
|
| Uses historical/reference pricing.
|
| This remains separate from the actionable
| entry price because volatility is a market
| behavior question, not an entry valuation
| question.
|
*/

function calculateVolatilityRisk(
  change30d: number | null,

  currentPrice: number | null,

  high52Week: number | null,

  low52Week: number | null,
): {
  score: number;

  level: RiskLevel;

  reason: string;
} {
  let score = 25;

  const reasons: string[] = [];


  if (change30d === null) {
    score += 20;

    reasons.push(
      "Insufficient 30-day price history increases volatility uncertainty.",
    );
  } else {
    const absoluteChange =
      Math.abs(
        change30d,
      );


    if (absoluteChange >= 20) {
      score += 45;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1,
        )}% over 30 days, indicating very high short-term volatility.`,
      );
    } else if (
      absoluteChange >= 10
    ) {
      score += 30;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1,
        )}% over 30 days, indicating elevated short-term volatility.`,
      );
    } else if (
      absoluteChange >= 5
    ) {
      score += 15;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1,
        )}% over 30 days, indicating moderate short-term volatility.`,
      );
    } else if (
      absoluteChange >= 2
    ) {
      score += 5;

      reasons.push(
        `The price moved ${absoluteChange.toFixed(
          1,
        )}% over 30 days, indicating relatively stable short-term movement.`,
      );
    } else {
      score -= 10;

      reasons.push(
        `The price changed only ${absoluteChange.toFixed(
          1,
        )}% over 30 days, indicating low short-term volatility.`,
      );
    }
  }


  const hasValidRange =
    currentPrice !== null &&
    currentPrice > 0 &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;


  if (hasValidRange) {
    const rangeWidth =
      (
        (
          high52Week -
          low52Week
        ) /
        currentPrice
      ) *
      100;


    if (rangeWidth >= 50) {
      score += 25;
    } else if (
      rangeWidth >= 30
    ) {
      score += 15;
    } else if (
      rangeWidth >= 15
    ) {
      score += 5;
    } else {
      score -= 5;
    }
  }


  const finalScore =
    clampScore(
      score,
    );


  return {
    score:
      finalScore,

    level:
      getRiskLevel(
        finalScore,
      ),

    reason:
      reasons[0] ??
      "Available pricing evidence indicates moderate volatility.",
  };
}


/*
|--------------------------------------------------------------------------
| Liquidity Risk
|--------------------------------------------------------------------------
*/

function calculateLiquidityRisk(
  salesTracked: number,

  activeListingsCount: number,
): {
  score: number;

  level: RiskLevel;

  reason: string;
} {
  const safeSalesCount =
    Math.max(
      0,
      salesTracked,
    );


  const safeListingsCount =
    Math.max(
      0,
      Math.floor(
        activeListingsCount,
      ),
    );


  let transactionScore: number;


  if (safeSalesCount >= 30) {
    transactionScore = 10;
  } else if (
    safeSalesCount >= 20
  ) {
    transactionScore = 20;
  } else if (
    safeSalesCount >= 10
  ) {
    transactionScore = 35;
  } else if (
    safeSalesCount >= 5
  ) {
    transactionScore = 50;
  } else if (
    safeSalesCount >= 2
  ) {
    transactionScore = 70;
  } else if (
    safeSalesCount === 1
  ) {
    transactionScore = 85;
  } else {
    transactionScore = 100;
  }


  let listingDepthScore: number;


  if (safeListingsCount >= 30) {
    listingDepthScore = 10;
  } else if (
    safeListingsCount >= 20
  ) {
    listingDepthScore = 20;
  } else if (
    safeListingsCount >= 10
  ) {
    listingDepthScore = 35;
  } else if (
    safeListingsCount >= 5
  ) {
    listingDepthScore = 50;
  } else if (
    safeListingsCount >= 2
  ) {
    listingDepthScore = 70;
  } else if (
    safeListingsCount === 1
  ) {
    listingDepthScore = 85;
  } else {
    listingDepthScore = 100;
  }


  const finalScore =
    clampScore(
      transactionScore *
        0.75 +
      listingDepthScore *
        0.25,
    );


  let reason: string;


  if (
    safeSalesCount >= 20 &&
    safeListingsCount >= 10
  ) {
    reason =
      `${safeSalesCount} verified recent sales and ${safeListingsCount} active listings indicate strong market liquidity.`;
  } else if (
    safeSalesCount >= 10
  ) {
    reason =
      `${safeSalesCount} verified recent sales provide meaningful transaction liquidity, with ${safeListingsCount} active listings currently observed.`;
  } else if (
    safeSalesCount >= 5
  ) {
    reason =
      `${safeSalesCount} verified recent sales provide usable but limited liquidity evidence.`;
  } else if (
    safeSalesCount > 0
  ) {
    reason =
      `Only ${safeSalesCount} verified recent ${
        safeSalesCount === 1
          ? "sale is"
          : "sales are"
      } available, increasing transaction-liquidity risk.`;
  } else {
    reason =
      "No verified recent sales are available, creating significant transaction-liquidity uncertainty.";
  }


  return {
    score:
      finalScore,

    level:
      getRiskLevel(
        finalScore,
      ),

    reason,
  };
}


/*
|--------------------------------------------------------------------------
| Valuation Risk
|--------------------------------------------------------------------------
|
| This uses ENTRY PRICE vs FAIR VALUE.
|
| It does not use the broader historical/reference
| market price for the Fair Value comparison.
|
| Historical 52-week position still uses the
| reference market price because that history
| comes from the same pricing series.
|
*/

function calculateValuationRisk(
  entryPrice: number | null,

  fairValue: number | null,

  referenceMarketPrice: number | null,

  high52Week: number | null,

  low52Week: number | null,
): {
  score: number;

  level: RiskLevel;

  reason: string;
} {
  let fairValueRisk:
    number | null =
    null;


  let valuationGapPercent:
    number | null =
    null;


  const hasFairValueComparison =
    entryPrice !== null &&
    entryPrice > 0 &&
    fairValue !== null &&
    fairValue > 0;


  if (hasFairValueComparison) {
    valuationGapPercent =
      (
        (
          entryPrice -
          fairValue
        ) /
        fairValue
      ) *
      100;


    if (valuationGapPercent >= 20) {
      fairValueRisk = 95;
    } else if (
      valuationGapPercent >= 10
    ) {
      fairValueRisk = 80;
    } else if (
      valuationGapPercent >= 5
    ) {
      fairValueRisk = 65;
    } else if (
      valuationGapPercent > -5
    ) {
      fairValueRisk = 45;
    } else if (
      valuationGapPercent > -10
    ) {
      fairValueRisk = 35;
    } else if (
      valuationGapPercent > -20
    ) {
      fairValueRisk = 25;
    } else {
      fairValueRisk = 15;
    }
  }


  let rangeRisk:
    number | null =
    null;


  const hasValidHistoricalRange =
    referenceMarketPrice !== null &&
    referenceMarketPrice > 0 &&
    high52Week !== null &&
    low52Week !== null &&
    high52Week > low52Week;


  if (hasValidHistoricalRange) {
    const rangePosition =
      (
        referenceMarketPrice -
        low52Week
      ) /
      (
        high52Week -
        low52Week
      );


    if (rangePosition >= 0.9) {
      rangeRisk = 75;
    } else if (
      rangePosition >= 0.7
    ) {
      rangeRisk = 60;
    } else if (
      rangePosition >= 0.35
    ) {
      rangeRisk = 45;
    } else if (
      rangePosition >= 0.1
    ) {
      rangeRisk = 30;
    } else {
      rangeRisk = 20;
    }
  }


  let score: number;


  if (
    fairValueRisk !== null &&
    rangeRisk !== null
  ) {
    score =
      fairValueRisk *
        0.75 +
      rangeRisk *
        0.25;
  } else if (
    fairValueRisk !== null
  ) {
    score =
      fairValueRisk;
  } else if (
    rangeRisk !== null
  ) {
    score =
      rangeRisk;
  } else {
    score =
      65;
  }


  const finalScore =
    clampScore(
      score,
    );


  let reason: string;


  if (
    valuationGapPercent !== null
  ) {
    if (
      valuationGapPercent >= 10
    ) {
      reason =
        `The best available entry price is ${valuationGapPercent.toFixed(
          1,
        )}% above estimated Fair Value, increasing valuation risk.`;
    } else if (
      valuationGapPercent >= 5
    ) {
      reason =
        "The best available entry price is modestly above estimated Fair Value.";
    } else if (
      valuationGapPercent > -5
    ) {
      reason =
        "The best available entry price is trading close to estimated Fair Value.";
    } else {
      reason =
        `The best available entry price is ${Math.abs(
          valuationGapPercent,
        ).toFixed(
          1,
        )}% below estimated Fair Value, reducing price-entry risk.`;
    }
  } else if (
    rangeRisk !== null
  ) {
    reason =
      "An actionable entry price is unavailable, so valuation risk is based on the product's position within its 52-week reference-price range.";
  } else {
    reason =
      "Available evidence is insufficient to make a dependable valuation-risk assessment.";
  }


  return {
    score:
      finalScore,

    level:
      getRiskLevel(
        finalScore,
      ),

    reason,
  };
}


/*
|--------------------------------------------------------------------------
| Data Risk
|--------------------------------------------------------------------------
*/

function calculateDataRisk(
  marketConfidence:
    ConfidenceResult,
): {
  score: number;

  level: RiskLevel;

  reason: string;
} {
  const finalScore =
    clampScore(
      100 -
      marketConfidence.score,
    );


  let reason: string;


  switch (
    marketConfidence.confidence
  ) {
    case "High":
      reason =
        `High-quality market evidence (${marketConfidence.score}/100 confidence) keeps data risk low.`;
      break;

    case "Medium":
      reason =
        `Market evidence is moderately reliable (${marketConfidence.score}/100 confidence), leaving some data uncertainty.`;
      break;

    case "Low":
      reason =
        `Market evidence confidence is low (${marketConfidence.score}/100), increasing data risk.`;
      break;

    case "Insufficient":
      reason =
        "Available market evidence is insufficient for a dependable assessment.";
      break;
  }


  return {
    score:
      finalScore,

    level:
      getRiskLevel(
        finalScore,
      ),

    reason,
  };
}


export function calculateRiskAnalysis({
  statistics,

  trendAnalysis,

  marketConfidence,

  fairValue,

  entryPrice,

  activeListingsCount,
}: RiskAnalysisInput): RiskAnalysisResult {
  const {
    currentPrice,

    change30d,

    high52Week,

    low52Week,

    salesTracked,
  } = statistics;


  const volatility =
    calculateVolatilityRisk(
      change30d,

      currentPrice,

      high52Week,

      low52Week,
    );


  const liquidity =
    calculateLiquidityRisk(
      salesTracked,

      activeListingsCount,
    );


  const valuation =
    calculateValuationRisk(
      entryPrice,

      fairValue,

      currentPrice,

      high52Week,

      low52Week,
    );


  const data =
    calculateDataRisk(
      marketConfidence,
    );


  /*
   * Weighted overall risk
   *
   * Volatility:   30%
   * Liquidity:    25%
   * Valuation:    25%
   * Data quality: 20%
   */

  let weightedRisk =
    volatility.score *
      0.30 +
    liquidity.score *
      0.25 +
    valuation.score *
      0.25 +
    data.score *
      0.20;


  /*
   * Negative directional momentum creates
   * additional downside risk.
   */

  if (
    trendAnalysis.trend ===
    "Very Bearish"
  ) {
    weightedRisk +=
      10;
  } else if (
    trendAnalysis.trend ===
    "Bearish"
  ) {
    weightedRisk +=
      5;
  }


  const riskScore =
    clampScore(
      weightedRisk,
    );


  return {
    overallRisk:
      getRiskLevel(
        riskScore,
      ),

    riskScore,

    volatilityRisk:
      volatility.level,

    liquidityRisk:
      liquidity.level,

    valuationRisk:
      valuation.level,

    dataRisk:
      data.level,

    volatilityRiskScore:
      volatility.score,

    liquidityRiskScore:
      liquidity.score,

    valuationRiskScore:
      valuation.score,

    dataRiskScore:
      data.score,

    reasons: [
      volatility.reason,

      liquidity.reason,

      valuation.reason,

      data.reason,
    ],
  };
}