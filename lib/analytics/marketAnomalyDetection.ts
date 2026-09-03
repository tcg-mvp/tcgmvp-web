export type MarketAnomalyLevel =
  | "None"
  | "Low"
  | "Moderate"
  | "High";


export type MarketAnomalyFlag =
  | "SALE_OUTLIERS"
  | "LISTING_OUTLIERS"
  | "HIGH_SALE_DISPERSION"
  | "WIDE_LISTING_SPREAD"
  | "LOWEST_LISTING_DISCOUNT";


export type MarketAnomalyDetectionInput = {
  salePrices:
    number[];

  listingPrices:
    number[];
};


export type MarketAnomalyDetectionResult = {
  anomalyScore:
    number;

  level:
    MarketAnomalyLevel;

  saleSampleSize:
    number;

  listingSampleSize:
    number;

  saleOutlierCount:
    number;

  listingOutlierCount:
    number;

  saleOutlierPercent:
    number | null;

  listingOutlierPercent:
    number | null;

  saleDispersionPercent:
    number | null;

  listingSpreadPercent:
    number | null;

  lowestListingDiscountPercent:
    number | null;

  saleMedian:
    number | null;

  listingMedian:
    number | null;

  lowestListing:
    number | null;

  flags:
    MarketAnomalyFlag[];

  reasons:
    string[];
};


function normalizePrices(
  values: number[],
): number[] {
  return values
    .filter(
      (
        value,
      ) =>
        Number.isFinite(
          value,
        ) &&
        value > 0,
    )
    .sort(
      (
        first,
        second,
      ) =>
        first -
        second,
    );
}


function roundOne(
  value: number,
): number {
  return (
    Math.round(
      value * 10,
    ) / 10
  );
}


function median(
  values: number[],
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }


  const middle =
    Math.floor(
      values.length / 2,
    );


  if (
    values.length % 2 ===
    0
  ) {
    return (
      values[
        middle - 1
      ] +
      values[
        middle
      ]
    ) /
      2;
  }


  return values[
    middle
  ];
}


function percentile(
  values: number[],
  percentileValue: number,
): number | null {
  if (
    values.length === 0
  ) {
    return null;
  }


  if (
    values.length === 1
  ) {
    return values[0];
  }


  const index =
    (
      values.length -
      1
    ) *
    percentileValue;


  const lower =
    Math.floor(
      index,
    );


  const upper =
    Math.ceil(
      index,
    );


  if (
    lower === upper
  ) {
    return values[
      lower
    ];
  }


  const fraction =
    index -
    lower;


  return (
    values[
      lower
    ] *
      (
        1 -
        fraction
      ) +
    values[
      upper
    ] *
      fraction
  );
}


/*
|--------------------------------------------------------------------------
| ROBUST OUTLIER DETECTION
|--------------------------------------------------------------------------
|
| Modified Z-score based on Median Absolute Deviation.
|
| Threshold:
| |modified z| > 3.5
|
| Unlike mean / standard deviation, MAD is resistant to extreme values.
|--------------------------------------------------------------------------
*/


function detectRobustOutliers(
  values: number[],
): number[] {
  /*
   * Very small samples are not sufficient for
   * robust statistical outlier detection.
   */
  if (
    values.length < 5
  ) {
    return [];
  }


  const center =
    median(
      values,
    );


  if (
    center === null
  ) {
    return [];
  }


  const deviations =
    values
      .map(
        (
          value,
        ) =>
          Math.abs(
            value -
            center,
          ),
      )
      .sort(
        (
          first,
          second,
        ) =>
          first -
          second,
      );


  const mad =
    median(
      deviations,
    );


  /*
   * Perfectly flat or near-flat samples can
   * produce MAD zero.
   *
   * In that situation, use the interquartile
   * range as a fallback.
   */
  if (
    mad === null ||
    mad === 0
  ) {
    const q1 =
      percentile(
        values,
        0.25,
      );


    const q3 =
      percentile(
        values,
        0.75,
      );


    if (
      q1 === null ||
      q3 === null
    ) {
      return [];
    }


    const iqr =
      q3 -
      q1;


    if (
      iqr === 0
    ) {
      /*
       * When almost every observation is
       * identical, values materially different
       * from the median are still suspicious.
       */
      return values.filter(
        (
          value,
        ) => {
          if (
            center <= 0
          ) {
            return false;
          }


          const differencePercent =
            Math.abs(
              value -
              center,
            ) /
            center *
            100;


          return (
            differencePercent >
            25
          );
        },
      );
    }


    const lowerFence =
      q1 -
      1.5 *
        iqr;


    const upperFence =
      q3 +
      1.5 *
        iqr;


    return values.filter(
      (
        value,
      ) =>
        value <
          lowerFence ||
        value >
          upperFence,
    );
  }


  return values.filter(
    (
      value,
    ) => {
      const modifiedZ =
        (
          0.6745 *
          (
            value -
            center
          )
        ) /
        mad;


      return (
        Math.abs(
          modifiedZ,
        ) >
        3.5
      );
    },
  );
}


/*
|--------------------------------------------------------------------------
| SALE DISPERSION
|--------------------------------------------------------------------------
|
| Uses IQR / median instead of max-min so one single extreme sale cannot
| itself manufacture high dispersion.
|--------------------------------------------------------------------------
*/


function calculateDispersionPercent(
  values: number[],
): number | null {
  if (
    values.length < 4
  ) {
    return null;
  }


  const center =
    median(
      values,
    );


  const q1 =
    percentile(
      values,
      0.25,
    );


  const q3 =
    percentile(
      values,
      0.75,
    );


  if (
    center === null ||
    center <= 0 ||
    q1 === null ||
    q3 === null
  ) {
    return null;
  }


  return roundOne(
    (
      (
        q3 -
        q1
      ) /
      center
    ) *
      100,
  );
}


/*
|--------------------------------------------------------------------------
| LISTING SPREAD
|--------------------------------------------------------------------------
|
| Uses P10 to P90 rather than raw min / max.
|
| This reduces sensitivity to one obviously bad listing while still
| identifying fragmented asking markets.
|--------------------------------------------------------------------------
*/


function calculateListingSpreadPercent(
  values: number[],
): number | null {
  if (
    values.length < 3
  ) {
    return null;
  }


  const center =
    median(
      values,
    );


  const lower =
    percentile(
      values,
      0.10,
    );


  const upper =
    percentile(
      values,
      0.90,
    );


  if (
    center === null ||
    center <= 0 ||
    lower === null ||
    upper === null
  ) {
    return null;
  }


  return roundOne(
    (
      (
        upper -
        lower
      ) /
      center
    ) *
      100,
  );
}


function calculateLowestListingDiscountPercent(
  values: number[],
): number | null {
  if (
    values.length < 2
  ) {
    return null;
  }


  const center =
    median(
      values,
    );


  if (
    center === null ||
    center <= 0
  ) {
    return null;
  }


  const lowest =
    values[0];


  if (
    lowest >= center
  ) {
    return 0;
  }


  return roundOne(
    (
      (
        center -
        lowest
      ) /
      center
    ) *
      100,
  );
}


function getAnomalyLevel(
  score: number,
): MarketAnomalyLevel {
  if (
    score >= 70
  ) {
    return "High";
  }


  if (
    score >= 40
  ) {
    return "Moderate";
  }


  if (
    score >= 20
  ) {
    return "Low";
  }


  return "None";
}


export function calculateMarketAnomalyDetection({
  salePrices,
  listingPrices,
}: MarketAnomalyDetectionInput): MarketAnomalyDetectionResult {
  const sales =
    normalizePrices(
      salePrices,
    );


  const listings =
    normalizePrices(
      listingPrices,
    );


  const saleMedian =
    median(
      sales,
    );


  const listingMedian =
    median(
      listings,
    );


  const lowestListing =
    listings.length > 0
      ? listings[0]
      : null;


  const saleOutliers =
    detectRobustOutliers(
      sales,
    );


  const listingOutliers =
    detectRobustOutliers(
      listings,
    );


  const saleOutlierPercent =
    sales.length > 0
      ? roundOne(
          (
            saleOutliers.length /
            sales.length
          ) *
            100,
        )
      : null;


  const listingOutlierPercent =
    listings.length > 0
      ? roundOne(
          (
            listingOutliers.length /
            listings.length
          ) *
            100,
        )
      : null;


  const saleDispersionPercent =
    calculateDispersionPercent(
      sales,
    );


  const listingSpreadPercent =
    calculateListingSpreadPercent(
      listings,
    );


  const lowestListingDiscountPercent =
    calculateLowestListingDiscountPercent(
      listings,
    );


  const flags:
    MarketAnomalyFlag[] =
    [];


  const reasons:
    string[] =
    [];


  let score = 0;


  /*
  |--------------------------------------------------------------------------
  | SALE OUTLIERS
  |--------------------------------------------------------------------------
  */


  if (
    saleOutliers.length >
    0
  ) {
    flags.push(
      "SALE_OUTLIERS",
    );


    const outlierRate =
      saleOutlierPercent ??
      0;


    if (
      outlierRate >= 20
    ) {
      score += 30;
    } else if (
      outlierRate >= 10
    ) {
      score += 20;
    } else {
      score += 10;
    }


    reasons.push(
      `${saleOutliers.length} statistically unusual verified sale(s) detected among ${sales.length} observations.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LISTING OUTLIERS
  |--------------------------------------------------------------------------
  */


  if (
    listingOutliers.length >
    0
  ) {
    flags.push(
      "LISTING_OUTLIERS",
    );


    const outlierRate =
      listingOutlierPercent ??
      0;


    if (
      outlierRate >= 20
    ) {
      score += 25;
    } else if (
      outlierRate >= 10
    ) {
      score += 15;
    } else {
      score += 10;
    }


    reasons.push(
      `${listingOutliers.length} statistically unusual active listing(s) detected among ${listings.length} observations.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SALE DISPERSION
  |--------------------------------------------------------------------------
  */


  if (
    saleDispersionPercent !==
      null &&
    saleDispersionPercent >=
      35
  ) {
    flags.push(
      "HIGH_SALE_DISPERSION",
    );


    if (
      saleDispersionPercent >=
      60
    ) {
      score += 25;
    } else {
      score += 15;
    }


    reasons.push(
      `Verified-sale prices show ${saleDispersionPercent.toFixed(
        1,
      )}% interquartile dispersion around the median.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LISTING SPREAD
  |--------------------------------------------------------------------------
  */


  if (
    listingSpreadPercent !==
      null &&
    listingSpreadPercent >=
      50
  ) {
    flags.push(
      "WIDE_LISTING_SPREAD",
    );


    if (
      listingSpreadPercent >=
      100
    ) {
      score += 25;
    } else if (
      listingSpreadPercent >=
      75
    ) {
      score += 20;
    } else {
      score += 10;
    }


    reasons.push(
      `The active listing market has a ${listingSpreadPercent.toFixed(
        1,
      )}% robust price spread.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LOWEST ASK DISCOUNT
  |--------------------------------------------------------------------------
  |
  | A single low listing can be a legitimate deal, but a listing more than
  | 30% below the active-market median deserves review for condition,
  | language, quantity, authenticity, or matching errors.
  |--------------------------------------------------------------------------
  */


  if (
    lowestListingDiscountPercent !==
      null &&
    lowestListingDiscountPercent >=
      30
  ) {
    flags.push(
      "LOWEST_LISTING_DISCOUNT",
    );


    if (
      lowestListingDiscountPercent >=
      50
    ) {
      score += 25;
    } else {
      score += 15;
    }


    reasons.push(
      `The lowest active listing is ${lowestListingDiscountPercent.toFixed(
        1,
      )}% below the active-market median.`,
    );
  }


  const anomalyScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          score,
        ),
      ),
    );


  const level =
    getAnomalyLevel(
      anomalyScore,
    );


  if (
    flags.length === 0
  ) {
    reasons.push(
      "No material statistical market anomalies were detected in the available samples.",
    );
  }


  return {
    anomalyScore,
    level,

    saleSampleSize:
      sales.length,

    listingSampleSize:
      listings.length,

    saleOutlierCount:
      saleOutliers.length,

    listingOutlierCount:
      listingOutliers.length,

    saleOutlierPercent,

    listingOutlierPercent,

    saleDispersionPercent,

    listingSpreadPercent,

    lowestListingDiscountPercent,

    saleMedian,

    listingMedian,

    lowestListing,

    flags,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}