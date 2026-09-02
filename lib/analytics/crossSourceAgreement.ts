export type CrossSourceAgreementLabel =
  | "Strong"
  | "Moderate"
  | "Weak"
  | "Divergent"
  | "Unavailable";


export type CrossSourceAgreementInput = {
  /**
   * Canonical TCGPlayer / TCGCSV market price.
   */
  referencePrice: number | null;

  /**
   * Median verified realized eBay sale price.
   */
  soldMedianPrice: number | null;

  /**
   * Median current eBay active listing price.
   *
   * This should represent the center of the
   * active asking market, NOT the lowest
   * actionable listing.
   */
  activeMedianPrice: number | null;
};


export type CrossSourceAgreementResult = {
  score: number | null;

  agreement:
    CrossSourceAgreementLabel;

  referencePrice:
    number | null;

  soldMedianPrice:
    number | null;

  activeMedianPrice:
    number | null;

  referenceVsSoldPercent:
    number | null;

  referenceVsActivePercent:
    number | null;

  soldVsActivePercent:
    number | null;

  /**
   * Number of valid market signals available.
   *
   * 1 = insufficient for agreement analysis
   * 2 = one usable comparison
   * 3 = full comparison set
   */
  signalsAvailable: number;

  /**
   * Number of pairwise comparisons actually used.
   */
  comparisonsAvailable: number;

  reasons: string[];
};


function isValidPrice(
  value: number | null,
): value is number {
  return (
    value !== null &&
    Number.isFinite(
      value,
    ) &&
    value > 0
  );
}


function roundPercent(
  value: number,
): number {
  return (
    Math.round(
      value * 10,
    ) / 10
  );
}


function roundScore(
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


/**
 * Symmetric percentage difference.
 *
 * This avoids denominator bias from choosing
 * one price as the baseline.
 *
 * Example:
 *
 * $100 vs $110
 *
 * difference =
 * 10 / 105 = 9.5%
 */
function calculateDifferencePercent(
  first: number,
  second: number,
): number {
  const midpoint =
    (
      first +
      second
    ) /
    2;


  if (
    midpoint <= 0
  ) {
    return 0;
  }


  return roundPercent(
    (
      Math.abs(
        first -
        second,
      ) /
      midpoint
    ) *
      100,
  );
}


function scoreDifference(
  differencePercent: number,
): number {
  /*
   * Cross-market agreement bands.
   *
   * <= 5%   Excellent agreement
   * <= 10%  Strong agreement
   * <= 15%  Good agreement
   * <= 20%  Moderate divergence
   * <= 30%  Weak agreement
   * <= 40%  Significant divergence
   * > 40%   Severe divergence
   */

  if (
    differencePercent <= 5
  ) {
    return 100;
  }

  if (
    differencePercent <= 10
  ) {
    return 90;
  }

  if (
    differencePercent <= 15
  ) {
    return 75;
  }

  if (
    differencePercent <= 20
  ) {
    return 60;
  }

  if (
    differencePercent <= 30
  ) {
    return 40;
  }

  if (
    differencePercent <= 40
  ) {
    return 20;
  }

  return 5;
}


function getAgreementLabel(
  score: number,
): CrossSourceAgreementLabel {
  if (score >= 85) {
    return "Strong";
  }

  if (score >= 65) {
    return "Moderate";
  }

  if (score >= 40) {
    return "Weak";
  }

  return "Divergent";
}


export function calculateCrossSourceAgreement({
  referencePrice,
  soldMedianPrice,
  activeMedianPrice,
}: CrossSourceAgreementInput): CrossSourceAgreementResult {
  const validReferencePrice =
    isValidPrice(
      referencePrice,
    )
      ? referencePrice
      : null;


  const validSoldMedianPrice =
    isValidPrice(
      soldMedianPrice,
    )
      ? soldMedianPrice
      : null;


  const validActiveMedianPrice =
    isValidPrice(
      activeMedianPrice,
    )
      ? activeMedianPrice
      : null;


  const signalsAvailable =
    [
      validReferencePrice,
      validSoldMedianPrice,
      validActiveMedianPrice,
    ].filter(
      (
        value,
      ) =>
        value !== null,
    ).length;


  const referenceVsSoldPercent =
    validReferencePrice !== null &&
    validSoldMedianPrice !== null
      ? calculateDifferencePercent(
          validReferencePrice,
          validSoldMedianPrice,
        )
      : null;


  const referenceVsActivePercent =
    validReferencePrice !== null &&
    validActiveMedianPrice !== null
      ? calculateDifferencePercent(
          validReferencePrice,
          validActiveMedianPrice,
        )
      : null;


  const soldVsActivePercent =
    validSoldMedianPrice !== null &&
    validActiveMedianPrice !== null
      ? calculateDifferencePercent(
          validSoldMedianPrice,
          validActiveMedianPrice,
        )
      : null;


  const comparisons: Array<{
    score: number;
    weight: number;
  }> = [];


  /*
   * TCGPlayer reference vs realized eBay sales
   * is the strongest cross-market comparison.
   */
  if (
    referenceVsSoldPercent !==
    null
  ) {
    comparisons.push({
      score:
        scoreDifference(
          referenceVsSoldPercent,
        ),

      weight:
        0.50,
    });
  }


  /*
   * TCGPlayer reference vs active eBay asks.
   */
  if (
    referenceVsActivePercent !==
    null
  ) {
    comparisons.push({
      score:
        scoreDifference(
          referenceVsActivePercent,
        ),

      weight:
        0.30,
    });
  }


  /*
   * Realized eBay sales vs active eBay asks.
   *
   * Useful confirmation, but lower weight
   * because both signals come from eBay.
   */
  if (
    soldVsActivePercent !==
    null
  ) {
    comparisons.push({
      score:
        scoreDifference(
          soldVsActivePercent,
        ),

      weight:
        0.20,
    });
  }


  const comparisonsAvailable =
    comparisons.length;


  /*
   * One market signal cannot establish agreement.
   */
  if (
    comparisonsAvailable === 0
  ) {
    return {
      score:
        null,

      agreement:
        "Unavailable",

      referencePrice:
        validReferencePrice,

      soldMedianPrice:
        validSoldMedianPrice,

      activeMedianPrice:
        validActiveMedianPrice,

      referenceVsSoldPercent:
        null,

      referenceVsActivePercent:
        null,

      soldVsActivePercent:
        null,

      signalsAvailable,

      comparisonsAvailable,

      reasons: [
        "At least two valid market-price signals are required to evaluate cross-source agreement.",
      ],
    };
  }


  /*
   * Normalize weights across whichever
   * comparisons are actually available.
   *
   * Missing evidence is therefore NOT treated
   * as disagreement.
   */
  const totalWeight =
    comparisons.reduce(
      (
        total,
        comparison,
      ) =>
        total +
        comparison.weight,
      0,
    );


  const weightedScore =
    comparisons.reduce(
      (
        total,
        comparison,
      ) =>
        total +
        comparison.score *
          comparison.weight,
      0,
    ) /
    totalWeight;


  const score =
    roundScore(
      weightedScore,
    );


  const agreement =
    getAgreementLabel(
      score,
    );


  const reasons: string[] =
    [];


  if (
    referenceVsSoldPercent !==
    null
  ) {
    reasons.push(
      `TCGPlayer reference pricing and verified eBay sales differ by ${referenceVsSoldPercent.toFixed(
        1,
      )}%.`,
    );
  }


  if (
    referenceVsActivePercent !==
    null
  ) {
    reasons.push(
      `TCGPlayer reference pricing and active eBay asking prices differ by ${referenceVsActivePercent.toFixed(
        1,
      )}%.`,
    );
  }


  if (
    soldVsActivePercent !==
    null
  ) {
    reasons.push(
      `Verified eBay sales and active eBay asking prices differ by ${soldVsActivePercent.toFixed(
        1,
      )}%.`,
    );
  }


  if (
    signalsAvailable === 2
  ) {
    reasons.push(
      "Agreement is based on two available market-price signals; an additional signal would strengthen confirmation.",
    );
  }


  if (
    agreement === "Strong"
  ) {
    reasons.push(
      "Available market-price signals show strong agreement.",
    );
  } else if (
    agreement === "Moderate"
  ) {
    reasons.push(
      "Available market-price signals show generally consistent pricing with some divergence.",
    );
  } else if (
    agreement === "Weak"
  ) {
    reasons.push(
      "Available market-price signals show meaningful pricing divergence.",
    );
  } else {
    reasons.push(
      "Available market-price signals diverge materially and should be interpreted cautiously.",
    );
  }


  return {
    score,

    agreement,

    referencePrice:
      validReferencePrice,

    soldMedianPrice:
      validSoldMedianPrice,

    activeMedianPrice:
      validActiveMedianPrice,

    referenceVsSoldPercent,

    referenceVsActivePercent,

    soldVsActivePercent,

    signalsAvailable,

    comparisonsAvailable,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}