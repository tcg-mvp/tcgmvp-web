export type ConfidenceLevel =
  | "High"
  | "Medium"
  | "Low"
  | "Insufficient";


export type ConfidenceInput = {
  /**
   * Number of recent verified completed sales.
   */
  recentSalesCount: number;

  /**
   * Number of active listings in the latest
   * trusted marketplace snapshot.
   */
  activeListingsCount: number;

  /**
   * Number of valid historical market-price
   * observations available.
   */
  priceHistoryPoints: number;

  /**
   * Whether a valid current market price exists.
   */
  hasCurrentPrice: boolean;

  /**
   * Whether the Fair Value engine produced
   * a usable valuation estimate.
   */
  hasFairValue: boolean;

  /**
   * Number of days since the most recent
   * trusted market observation.
   *
   * Leave undefined only when freshness
   * genuinely cannot be determined.
   */
  dataAgeDays?: number;
};


export type ConfidenceResult = {
  /**
   * Evidence-quality score from 0–95.
   *
   * TCGMVP intentionally reserves 100 for a
   * future confidence model incorporating
   * broader source diversity and explicit
   * cross-source agreement.
   */
  score: number;

  confidence: ConfidenceLevel;

  reasons: string[];
};


/*
|--------------------------------------------------------------------------
| TCGMVP Shared Market Confidence
|--------------------------------------------------------------------------
|
| Confidence answers one question:
|
| "How much should we trust the available market evidence?"
|
| It does NOT answer:
|
| - whether the product is a good investment
| - whether the market is bullish
| - whether the current price is attractive
| - whether the product has low risk
|
| Those questions belong to other analytics engines.
|
| Evidence dimensions:
|
| Recent verified sales       35 points
| Active listing depth        20 points
| Historical pricing depth    20 points
| Core valuation availability 15 points
| Data freshness              10 points
|
| Maximum modeled confidence:
| 95 / 100
|
*/


const clampScore = (
  score: number,
): number => {
  return Math.max(
    0,
    Math.min(
      95,
      Math.round(score),
    ),
  );
};


function sanitizeCount(
  value: number,
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}


function getConfidenceLevel(
  score: number,
  {
    recentSalesCount,
    activeListingsCount,
    priceHistoryPoints,
    hasCurrentPrice,
  }: ConfidenceInput,
): ConfidenceLevel {
  /*
   * A current market price is the minimum
   * requirement for a meaningful market
   * assessment.
   */
  if (!hasCurrentPrice) {
    return "Insufficient";
  }


  /*
   * If there is essentially no supporting
   * marketplace or historical evidence,
   * there is not enough information to form
   * a dependable assessment.
   */
  const hasSupportingEvidence =
    recentSalesCount > 0 ||
    activeListingsCount > 0 ||
    priceHistoryPoints >= 5;


  if (!hasSupportingEvidence) {
    return "Insufficient";
  }


  if (score >= 80) {
    return "High";
  }

  if (score >= 55) {
    return "Medium";
  }

  return "Low";
}


export function calculateConfidence(
  input: ConfidenceInput,
): ConfidenceResult {
  const recentSalesCount =
    sanitizeCount(
      input.recentSalesCount,
    );

  const activeListingsCount =
    sanitizeCount(
      input.activeListingsCount,
    );

  const priceHistoryPoints =
    sanitizeCount(
      input.priceHistoryPoints,
    );


  let score = 0;


  /*
  |--------------------------------------------------------------------------
  | 1. Recent verified sales — maximum 35 points
  |--------------------------------------------------------------------------
  |
  | Realized transactions are the strongest
  | evidence for present market value.
  |
  */

  if (recentSalesCount >= 20) {
    score += 35;
  } else if (
    recentSalesCount >= 10
  ) {
    score += 30;
  } else if (
    recentSalesCount >= 5
  ) {
    score += 22;
  } else if (
    recentSalesCount >= 2
  ) {
    score += 12;
  } else if (
    recentSalesCount === 1
  ) {
    score += 5;
  }


  /*
  |--------------------------------------------------------------------------
  | 2. Active listing depth — maximum 20 points
  |--------------------------------------------------------------------------
  |
  | Active supply provides additional evidence
  | about current market participation and
  | pricing depth.
  |
  */

  if (activeListingsCount >= 20) {
    score += 20;
  } else if (
    activeListingsCount >= 10
  ) {
    score += 17;
  } else if (
    activeListingsCount >= 5
  ) {
    score += 12;
  } else if (
    activeListingsCount >= 2
  ) {
    score += 7;
  } else if (
    activeListingsCount === 1
  ) {
    score += 3;
  }


  /*
  |--------------------------------------------------------------------------
  | 3. Historical pricing depth — maximum 20 points
  |--------------------------------------------------------------------------
  |
  | Historical observations provide context for
  | trend, range, volatility, and valuation analysis.
  |
  */

  if (priceHistoryPoints >= 90) {
    score += 20;
  } else if (
    priceHistoryPoints >= 30
  ) {
    score += 16;
  } else if (
    priceHistoryPoints >= 14
  ) {
    score += 11;
  } else if (
    priceHistoryPoints >= 5
  ) {
    score += 6;
  } else if (
    priceHistoryPoints > 0
  ) {
    score += 2;
  }


  /*
  |--------------------------------------------------------------------------
  | 4. Core valuation availability — maximum 15 points
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
  | 5. Data freshness — maximum 10 points
  |--------------------------------------------------------------------------
  |
  | Freshness should eventually be supplied from
  | the actual latest market observation rather
  | than a hardcoded value.
  |
  */

  if (
    input.dataAgeDays === undefined
  ) {
    /*
     * Unknown freshness receives partial credit,
     * but never the full freshness allocation.
     */
    score += 5;
  } else {
    const dataAgeDays =
      Math.max(
        0,
        input.dataAgeDays,
      );

    if (dataAgeDays <= 1) {
      score += 10;
    } else if (
      dataAgeDays <= 7
    ) {
      score += 8;
    } else if (
      dataAgeDays <= 30
    ) {
      score += 5;
    } else if (
      dataAgeDays <= 90
    ) {
      score += 2;
    }
  }


  const finalScore =
    clampScore(score);


  const confidence =
    getConfidenceLevel(
      finalScore,
      {
        ...input,

        recentSalesCount,

        activeListingsCount,

        priceHistoryPoints,
      },
    );


  const reasons: string[] = [];


  /*
  |--------------------------------------------------------------------------
  | Sales evidence explanation
  |--------------------------------------------------------------------------
  */

  if (recentSalesCount >= 20) {
    reasons.push(
      "Deep recent verified sales evidence",
    );
  } else if (
    recentSalesCount >= 10
  ) {
    reasons.push(
      "Strong recent verified sales evidence",
    );
  } else if (
    recentSalesCount >= 5
  ) {
    reasons.push(
      "Moderate recent verified sales evidence",
    );
  } else if (
    recentSalesCount > 0
  ) {
    reasons.push(
      "Limited recent verified sales evidence",
    );
  } else {
    reasons.push(
      "No recent verified sales evidence",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Active-market explanation
  |--------------------------------------------------------------------------
  */

  if (activeListingsCount >= 20) {
    reasons.push(
      "Deep active listing coverage",
    );
  } else if (
    activeListingsCount >= 10
  ) {
    reasons.push(
      "Healthy active listing depth",
    );
  } else if (
    activeListingsCount >= 2
  ) {
    reasons.push(
      "Limited active listing depth",
    );
  } else if (
    activeListingsCount === 1
  ) {
    reasons.push(
      "Minimal active listing depth",
    );
  } else {
    reasons.push(
      "No active listing evidence",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Historical evidence explanation
  |--------------------------------------------------------------------------
  */

  if (priceHistoryPoints >= 90) {
    reasons.push(
      "Deep historical pricing coverage",
    );
  } else if (
    priceHistoryPoints >= 30
  ) {
    reasons.push(
      "Meaningful historical pricing coverage",
    );
  } else if (
    priceHistoryPoints >= 5
  ) {
    reasons.push(
      "Limited historical pricing coverage",
    );
  } else if (
    priceHistoryPoints > 0
  ) {
    reasons.push(
      "Minimal historical pricing coverage",
    );
  } else {
    reasons.push(
      "No historical pricing data",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Core valuation availability
  |--------------------------------------------------------------------------
  */

  if (!input.hasCurrentPrice) {
    reasons.push(
      "Current market price is unavailable",
    );
  }

  if (!input.hasFairValue) {
    reasons.push(
      "Fair Value estimate is unavailable",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Freshness explanation
  |--------------------------------------------------------------------------
  */

  if (
    input.dataAgeDays === undefined
  ) {
    reasons.push(
      "Market-data freshness could not be fully verified",
    );
  } else if (
    input.dataAgeDays > 90
  ) {
    reasons.push(
      "Market data is materially stale",
    );
  } else if (
    input.dataAgeDays > 30
  ) {
    reasons.push(
      "Market data may be outdated",
    );
  }


  return {
    score:
      finalScore,

    confidence,

    /*
     * Keep the UI concise while preserving
     * the strongest evidence explanations.
     */
    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}