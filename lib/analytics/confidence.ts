export type ConfidenceLevel =
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";

export type ConfidenceInput = {
  recentSalesCount: number;
  activeListingsCount: number;
  priceHistoryPoints: number;

  hasCurrentPrice: boolean;
  hasFairValue: boolean;

  /**
   * Number of days since the market data was last updated.
   * Leave undefined when freshness is unknown.
   */
  dataAgeDays?: number;
};

export type ConfidenceResult = {
  score: number;
  confidence: ConfidenceLevel;
  reasons: string[];
};

/*
|--------------------------------------------------------------------------
| TCGMVP Confidence Engine
|--------------------------------------------------------------------------
|
| Confidence measures the quality of available market evidence,
| not whether the investment itself is good or bad.
|
| High confidence means:
| - sufficient recent sales
| - reliable pricing
| - adequate listing depth
| - meaningful historical data
|
| Low confidence simply means conclusions should be interpreted
| with greater caution.
|
| The current model intentionally caps confidence at 95/100.
| A perfect 100 is reserved for a future model that also accounts
| for factors such as cross-source agreement and broader source
| diversity.
|
*/

const clampScore = (
  score: number
): number => {
  return Math.max(
    0,
    Math.min(
      95,
      Math.round(score)
    )
  );
};


const getConfidenceLevel = (
  score: number,
  input: ConfidenceInput
): ConfidenceLevel => {
  const hasMinimumMarketData =
    input.hasCurrentPrice &&
    input.recentSalesCount > 0;

  if (!hasMinimumMarketData) {
    return "Insufficient";
  }

  if (score >= 80) {
    return "High";
  }

  if (score >= 55) {
    return "Medium";
  }

  return "Low";
};


export const calculateConfidence = (
  input: ConfidenceInput
): ConfidenceResult => {
  const recentSalesCount = Math.max(
    0,
    input.recentSalesCount
  );

  const activeListingsCount = Math.max(
    0,
    input.activeListingsCount
  );

  const priceHistoryPoints = Math.max(
    0,
    input.priceHistoryPoints
  );

  let score = 0;

  /*
  |--------------------------------------------------------------------------
  | Recent sales evidence — maximum 35 points
  |--------------------------------------------------------------------------
  */

  if (recentSalesCount >= 20) {
    score += 35;
  } else if (recentSalesCount >= 10) {
    score += 30;
  } else if (recentSalesCount >= 5) {
    score += 22;
  } else if (recentSalesCount >= 2) {
    score += 12;
  } else if (recentSalesCount === 1) {
    score += 5;
  }

  /*
  |--------------------------------------------------------------------------
  | Active listing depth — maximum 20 points
  |--------------------------------------------------------------------------
  */

  if (activeListingsCount >= 20) {
    score += 20;
  } else if (activeListingsCount >= 10) {
    score += 17;
  } else if (activeListingsCount >= 5) {
    score += 12;
  } else if (activeListingsCount >= 2) {
    score += 7;
  } else if (activeListingsCount === 1) {
    score += 3;
  }

  /*
  |--------------------------------------------------------------------------
  | Historical pricing depth — maximum 20 points
  |--------------------------------------------------------------------------
  */

  if (priceHistoryPoints >= 90) {
    score += 20;
  } else if (priceHistoryPoints >= 30) {
    score += 16;
  } else if (priceHistoryPoints >= 14) {
    score += 11;
  } else if (priceHistoryPoints >= 5) {
    score += 6;
  } else if (priceHistoryPoints > 0) {
    score += 2;
  }

  /*
  |--------------------------------------------------------------------------
  | Core valuation data — maximum 15 points
  |--------------------------------------------------------------------------
  */

  if (input.hasCurrentPrice) {
    score += 7;
  }

  if (input.hasFairValue) {
    score += 8;
  }

  /*
  |--------------------------------------------------------------------------
  | Data freshness — maximum 10 points
  |--------------------------------------------------------------------------
  */

  if (input.dataAgeDays === undefined) {
    score += 5;
  } else if (input.dataAgeDays <= 1) {
    score += 10;
  } else if (input.dataAgeDays <= 7) {
    score += 8;
  } else if (input.dataAgeDays <= 30) {
    score += 5;
  } else if (input.dataAgeDays <= 90) {
    score += 2;
  }

  const finalScore =
    clampScore(score);

  const confidence =
    getConfidenceLevel(
      finalScore,
      input
    );

  const reasons: string[] = [];

  if (recentSalesCount >= 20) {
    reasons.push(
      "Deep recent sales evidence"
    );
  } else if (recentSalesCount >= 10) {
    reasons.push(
      "Strong recent sales evidence"
    );
  } else if (recentSalesCount >= 5) {
    reasons.push(
      "Moderate recent sales evidence"
    );
  } else if (recentSalesCount > 0) {
    reasons.push(
      "Limited recent sales evidence"
    );
  } else {
    reasons.push(
      "No recent sales evidence"
    );
  }

  if (activeListingsCount >= 20) {
    reasons.push(
      "Deep active listing coverage"
    );
  } else if (activeListingsCount >= 10) {
    reasons.push(
      "Healthy active listing depth"
    );
  } else if (activeListingsCount >= 2) {
    reasons.push(
      "Limited active listing depth"
    );
  } else {
    reasons.push(
      "Minimal active listing data"
    );
  }

  if (priceHistoryPoints >= 90) {
    reasons.push(
      "Deep historical pricing coverage"
    );
  } else if (priceHistoryPoints >= 30) {
    reasons.push(
      "Meaningful historical pricing data"
    );
  } else if (priceHistoryPoints > 0) {
    reasons.push(
      "Limited historical pricing data"
    );
  } else {
    reasons.push(
      "No historical pricing data"
    );
  }

  if (!input.hasCurrentPrice) {
    reasons.push(
      "Current market price is unavailable"
    );
  }

  if (!input.hasFairValue) {
    reasons.push(
      "Fair value estimate is unavailable"
    );
  }

  if (
    input.dataAgeDays !== undefined &&
    input.dataAgeDays > 30
  ) {
    reasons.push(
      "Market data may be outdated"
    );
  }

  return {
    score: finalScore,
    confidence,
    reasons,
  };
};