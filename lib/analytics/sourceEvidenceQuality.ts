export type EvidenceQualityLabel =
  | "Excellent"
  | "Strong"
  | "Moderate"
  | "Thin"
  | "Insufficient";


export type SourceEvidenceQualityInput = {
  verifiedSalesCount:
    number;

  activeListingsCount:
    number;

  historyPoints:
    number;

  crossSourceComparisons:
    number;
};


export type SourceEvidenceQualityResult = {
  score:
    number;

  label:
    EvidenceQualityLabel;

  salesDepthScore:
    number;

  listingDepthScore:
    number;

  historyDepthScore:
    number;

  crossSourceDepthScore:
    number;

  verifiedSalesCount:
    number;

  activeListingsCount:
    number;

  historyPoints:
    number;

  crossSourceComparisons:
    number;

  reasons:
    string[];
};


function normalizeCount(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.floor(
      value,
    ),
  );
}


function clampScore(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        value,
      ),
    ),
  );
}


/*
|--------------------------------------------------------------------------
| VERIFIED SALES DEPTH
|--------------------------------------------------------------------------
|
| Completed transactions are the strongest direct evidence of realized
| market behavior.
|
| 0       ->   0
| 1       ->  20
| 2-4     ->  40
| 5-9     ->  65
| 10-24   ->  85
| 25+     -> 100
|
*/

function calculateSalesDepthScore(
  count: number,
): number {
  if (count === 0) {
    return 0;
  }


  if (count === 1) {
    return 20;
  }


  if (count <= 4) {
    return 40;
  }


  if (count <= 9) {
    return 65;
  }


  if (count <= 24) {
    return 85;
  }


  return 100;
}


/*
|--------------------------------------------------------------------------
| ACTIVE LISTING DEPTH
|--------------------------------------------------------------------------
|
| Active listings provide supply and asking-market evidence.
|
| 0       ->   0
| 1-2     ->  20
| 3-5     ->  40
| 6-9     ->  60
| 10-19   ->  80
| 20+     -> 100
|
*/

function calculateListingDepthScore(
  count: number,
): number {
  if (count === 0) {
    return 0;
  }


  if (count <= 2) {
    return 20;
  }


  if (count <= 5) {
    return 40;
  }


  if (count <= 9) {
    return 60;
  }


  if (count <= 19) {
    return 80;
  }


  return 100;
}


/*
|--------------------------------------------------------------------------
| PRICE-HISTORY DEPTH
|--------------------------------------------------------------------------
|
| Historical observations support trend, range, volatility, and long-term
| context. The thresholds are intentionally much larger than transaction
| thresholds because one historical point does not carry the same evidence
| value as one completed sale.
|
| 0         ->   0
| 1-29      ->  20
| 30-89     ->  40
| 90-179    ->  60
| 180-364   ->  80
| 365+      -> 100
|
*/

function calculateHistoryDepthScore(
  count: number,
): number {
  if (count === 0) {
    return 0;
  }


  if (count <= 29) {
    return 20;
  }


  if (count <= 89) {
    return 40;
  }


  if (count <= 179) {
    return 60;
  }


  if (count <= 364) {
    return 80;
  }


  return 100;
}


/*
|--------------------------------------------------------------------------
| CROSS-SOURCE DEPTH
|--------------------------------------------------------------------------
|
| With three market signals, there can be three pairwise comparisons:
|
| reference vs sold
| reference vs active
| sold vs active
|
| Zero means no market agreement can be measured.
|
*/

function calculateCrossSourceDepthScore(
  comparisons: number,
): number {
  if (comparisons <= 0) {
    return 0;
  }


  if (comparisons === 1) {
    return 60;
  }


  if (comparisons === 2) {
    return 80;
  }


  return 100;
}


function getEvidenceQualityLabel(
  score: number,
): EvidenceQualityLabel {
  if (score >= 85) {
    return "Excellent";
  }


  if (score >= 70) {
    return "Strong";
  }


  if (score >= 50) {
    return "Moderate";
  }


  if (score >= 30) {
    return "Thin";
  }


  return "Insufficient";
}


export function calculateSourceEvidenceQuality({
  verifiedSalesCount,
  activeListingsCount,
  historyPoints,
  crossSourceComparisons,
}: SourceEvidenceQualityInput): SourceEvidenceQualityResult {
  const salesCount =
    normalizeCount(
      verifiedSalesCount,
    );


  const listingCount =
    normalizeCount(
      activeListingsCount,
    );


  const historyCount =
    normalizeCount(
      historyPoints,
    );


  const comparisonCount =
    normalizeCount(
      crossSourceComparisons,
    );


  const salesDepthScore =
    calculateSalesDepthScore(
      salesCount,
    );


  const listingDepthScore =
    calculateListingDepthScore(
      listingCount,
    );


  const historyDepthScore =
    calculateHistoryDepthScore(
      historyCount,
    );


  const crossSourceDepthScore =
    calculateCrossSourceDepthScore(
      comparisonCount,
    );


  /*
  |--------------------------------------------------------------------------
  | WEIGHTING
  |--------------------------------------------------------------------------
  |
  | Verified sales        40%
  | Active listings       25%
  | Historical depth      20%
  | Cross-source depth    15%
  |
  | Transaction evidence receives the highest weight because realized market
  | behavior is more informative than asks or historical observations.
  |--------------------------------------------------------------------------
  */


  const score =
    clampScore(
      salesDepthScore *
        0.40 +
      listingDepthScore *
        0.25 +
      historyDepthScore *
        0.20 +
      crossSourceDepthScore *
        0.15,
    );


  const label =
    getEvidenceQualityLabel(
      score,
    );


  const reasons: string[] =
    [];


  if (salesCount === 0) {
    reasons.push(
      "No verified completed-sale evidence is currently available.",
    );
  } else if (salesCount < 5) {
    reasons.push(
      `Verified sales depth is thin with ${salesCount} completed transaction(s).`,
    );
  } else if (salesCount < 25) {
    reasons.push(
      `Verified sales provide a usable sample of ${salesCount} completed transactions.`,
    );
  } else {
    reasons.push(
      `Verified sales provide deep realized-market evidence with ${salesCount} completed transactions.`,
    );
  }


  if (listingCount === 0) {
    reasons.push(
      "No active listing evidence is currently available.",
    );
  } else if (listingCount < 6) {
    reasons.push(
      `Active-market depth is thin with ${listingCount} listing(s).`,
    );
  } else if (listingCount < 20) {
    reasons.push(
      `Active-market depth is moderate with ${listingCount} listings.`,
    );
  } else {
    reasons.push(
      `Active-market depth is strong with ${listingCount} listings.`,
    );
  }


  if (historyCount < 90) {
    reasons.push(
      `Historical evidence is limited to ${historyCount} observation(s).`,
    );
  } else if (historyCount < 365) {
    reasons.push(
      `Historical evidence contains ${historyCount} observations but does not yet provide a full year of depth.`,
    );
  } else {
    reasons.push(
      `Historical evidence is deep with ${historyCount} observations.`,
    );
  }


  if (comparisonCount === 0) {
    reasons.push(
      "No cross-source market comparison is currently available.",
    );
  } else if (comparisonCount === 1) {
    reasons.push(
      "Cross-source evidence is based on one pairwise market comparison.",
    );
  } else {
    reasons.push(
      `Cross-source evidence contains ${comparisonCount} pairwise market comparisons.`,
    );
  }


  return {
    score,
    label,

    salesDepthScore,
    listingDepthScore,
    historyDepthScore,
    crossSourceDepthScore,

    verifiedSalesCount:
      salesCount,

    activeListingsCount:
      listingCount,

    historyPoints:
      historyCount,

    crossSourceComparisons:
      comparisonCount,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}