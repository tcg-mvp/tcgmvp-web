export type CrossSourceAgreementLabel =
  | "Strong"
  | "Moderate"
  | "Weak"
  | "Divergent"
  | "Unavailable";


export type RealizedSalesDiagnosis =
  | "Confirms Both"
  | "Confirms Reference"
  | "Confirms Active Market"
  | "Between Markets"
  | "Independent Divergence"
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
   * This represents the center of the active
   * asking market, NOT actionable entry price.
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

  signalsAvailable:
    number;

  comparisonsAvailable:
    number;

  /**
   * Interpretation of which market is supported
   * by verified realized-sale evidence.
   *
   * This does NOT independently change the
   * agreement score.
   */
  realizedSalesDiagnosis:
    RealizedSalesDiagnosis;

  realizedSalesReason:
    string;

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
 * Symmetric percentage difference prevents
 * denominator bias.
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


/*
|--------------------------------------------------------------------------
| Realized-sales confirmation
|--------------------------------------------------------------------------
|
| Verified completed sales are treated as the
| strongest evidence of where buyers and sellers
| actually met.
|
| This diagnostic does not modify the agreement
| score. It explains divergence.
|
*/

function diagnoseRealizedSales({
  referencePrice,
  soldMedianPrice,
  activeMedianPrice,
  referenceVsSoldPercent,
  soldVsActivePercent,
}: {
  referencePrice:
    number | null;

  soldMedianPrice:
    number | null;

  activeMedianPrice:
    number | null;

  referenceVsSoldPercent:
    number | null;

  soldVsActivePercent:
    number | null;
}): {
  diagnosis:
    RealizedSalesDiagnosis;

  reason:
    string;
} {
  /*
   * No realized transaction evidence.
   */
  if (
    soldMedianPrice === null
  ) {
    return {
      diagnosis:
        "Unavailable",

      reason:
        "Verified realized-sale evidence is unavailable, so TCGMVP cannot determine which market-price signal is better supported by completed transactions.",
    };
  }


  /*
   * Realized sales require at least one
   * comparison market for confirmation.
   */
  if (
    referencePrice === null &&
    activeMedianPrice === null
  ) {
    return {
      diagnosis:
        "Unavailable",

      reason:
        "Verified realized sales are available, but no independent comparison market is available.",
    };
  }


  const confirmsReference =
    referenceVsSoldPercent !==
      null &&
    referenceVsSoldPercent <=
      10;


  const confirmsActive =
    soldVsActivePercent !==
      null &&
    soldVsActivePercent <=
      10;


  /*
   * Realized sales closely agree with both
   * the reference and active markets.
   */
  if (
    confirmsReference &&
    confirmsActive
  ) {
    return {
      diagnosis:
        "Confirms Both",

      reason:
        "Verified realized sales closely agree with both TCGPlayer reference pricing and the active eBay market.",
    };
  }


  /*
   * Realized sales agree with TCGPlayer but
   * active asking prices are materially apart.
   */
  if (
    confirmsReference &&
    !confirmsActive
  ) {
    return {
      diagnosis:
        "Confirms Reference",

      reason:
        "Verified realized sales align more closely with TCGPlayer reference pricing than with current eBay asking prices, suggesting active asks may be elevated or lagging realized buyer behavior.",
    };
  }


  /*
   * Realized sales agree with active asks while
   * TCGPlayer is materially apart.
   */
  if (
    confirmsActive &&
    !confirmsReference
  ) {
    return {
      diagnosis:
        "Confirms Active Market",

      reason:
        "Verified realized sales align more closely with the active eBay market than with TCGPlayer reference pricing, suggesting the reference market may be lagging current transaction behavior.",
    };
  }


  /*
   * When all three signals exist, determine
   * whether realized sales sit between the two
   * competing market-price signals.
   */
  if (
    referencePrice !== null &&
    activeMedianPrice !== null
  ) {
    const lowerMarketPrice =
      Math.min(
        referencePrice,
        activeMedianPrice,
      );


    const higherMarketPrice =
      Math.max(
        referencePrice,
        activeMedianPrice,
      );


    if (
      soldMedianPrice >=
        lowerMarketPrice &&
      soldMedianPrice <=
        higherMarketPrice
    ) {
      return {
        diagnosis:
          "Between Markets",

        reason:
          "Verified realized sales fall between TCGPlayer reference pricing and the active eBay market, so completed transactions do not clearly confirm either market signal.",
      };
    }
  }


  /*
   * Realized sales materially disagree with
   * the available comparison markets.
   */
  return {
    diagnosis:
      "Independent Divergence",

    reason:
      "Verified realized sales materially diverge from the available comparison-market pricing, indicating broader price disagreement that requires review.",
  };
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


  const realizedSales =
    diagnoseRealizedSales({
      referencePrice:
        validReferencePrice,

      soldMedianPrice:
        validSoldMedianPrice,

      activeMedianPrice:
        validActiveMedianPrice,

      referenceVsSoldPercent,

      soldVsActivePercent,
    });


  const comparisons: Array<{
    score: number;
    weight: number;
  }> = [];


  /*
   * TCGPlayer versus realized eBay transactions.
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
   * TCGPlayer versus active eBay asks.
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
   * Realized eBay sales versus active eBay asks.
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

      realizedSalesDiagnosis:
        realizedSales
          .diagnosis,

      realizedSalesReason:
        realizedSales.reason,

      reasons: [
        "At least two valid market-price signals are required to evaluate cross-source agreement.",
      ],
    };
  }


  /*
   * Missing evidence is not disagreement.
   *
   * Normalize weights across available comparisons.
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

    realizedSalesDiagnosis:
      realizedSales
        .diagnosis,

    realizedSalesReason:
      realizedSales.reason,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}