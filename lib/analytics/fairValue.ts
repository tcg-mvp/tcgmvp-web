export type FairValueInput = {
  /**
   * Verified realized sale prices.
   */
  sales: number[];

  /**
   * External/current reference price,
   * currently derived from TCGPlayer/TCGCSV.
   */
  referencePrice: number | null;
};


export type FairValueMethodology =
  | "sold_median"
  | "blended_moderate"
  | "blended_low"
  | "reference_only"
  | "insufficient";


export type FairValueResult = {
  fairValue: number | null;

  medianSale: number | null;
  averageSale: number | null;
  lowestSale: number | null;
  highestSale: number | null;

  salesCount: number;

  methodology:
    FairValueMethodology;
};


function calculateMedian(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [
    ...values,
  ].sort(
    (a, b) =>
      a - b,
  );

  const middle =
    Math.floor(
      sorted.length / 2,
    );

  if (
    sorted.length % 2 === 0
  ) {
    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2;
  }

  return sorted[middle];
}


function calculateAverage(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (
        total,
        value,
      ) =>
        total + value,
      0,
    ) /
    values.length
  );
}


function isValidPrice(
  value: number | null,
): value is number {
  return (
    value !== null &&
    Number.isFinite(value) &&
    value > 0
  );
}


export function calculateFairValue({
  sales,
  referencePrice,
}: FairValueInput): FairValueResult {
  /*
   * Only valid positive verified sale prices
   * may influence Fair Value.
   */
  const validSales =
    sales.filter(
      (sale) =>
        Number.isFinite(
          sale,
        ) &&
        sale > 0,
    );


  const validReferencePrice =
    isValidPrice(
      referencePrice,
    )
      ? referencePrice
      : null;


  const salesCount =
    validSales.length;


  const medianSale =
    calculateMedian(
      validSales,
    );


  const averageSale =
    calculateAverage(
      validSales,
    );


  const lowestSale =
    salesCount > 0
      ? Math.min(
          ...validSales,
        )
      : null;


  const highestSale =
    salesCount > 0
      ? Math.max(
          ...validSales,
        )
      : null;


  let fairValue:
    number | null =
    null;


  let methodology:
    FairValueMethodology =
    "insufficient";


  /*
  |--------------------------------------------------------------------------
  | Strong realized-sale evidence
  |--------------------------------------------------------------------------
  |
  | Five or more verified transactions provide
  | enough realized-market evidence for the median
  | sale price to stand on its own.
  |
  | Median is intentionally preferred over average
  | because it is more resistant to unusual sales.
  |
  */

  if (
    salesCount >= 5 &&
    medianSale !== null
  ) {
    fairValue =
      medianSale;

    methodology =
      "sold_median";
  }


  /*
  |--------------------------------------------------------------------------
  | Moderate realized-sale evidence
  |--------------------------------------------------------------------------
  |
  | With 2–4 verified sales, realized evidence
  | remains dominant while the external reference
  | price provides stabilization.
  |
  */

  else if (
    salesCount >= 2 &&
    medianSale !== null &&
    validReferencePrice !== null
  ) {
    fairValue =
      medianSale * 0.70 +
      validReferencePrice * 0.30;

    methodology =
      "blended_moderate";
  }


  /*
  |--------------------------------------------------------------------------
  | Limited realized-sale evidence
  |--------------------------------------------------------------------------
  |
  | A single transaction is useful evidence but
  | should not outweigh a broader reference source.
  |
  */

  else if (
    salesCount === 1 &&
    medianSale !== null &&
    validReferencePrice !== null
  ) {
    fairValue =
      medianSale * 0.40 +
      validReferencePrice * 0.60;

    methodology =
      "blended_low";
  }


  /*
  |--------------------------------------------------------------------------
  | Reference-only valuation
  |--------------------------------------------------------------------------
  */

  else if (
    validReferencePrice !== null
  ) {
    fairValue =
      validReferencePrice;

    methodology =
      "reference_only";
  }


  /*
  |--------------------------------------------------------------------------
  | Sold evidence without a reference price
  |--------------------------------------------------------------------------
  |
  | If reference pricing is unavailable, verified
  | realized-market evidence may still provide a
  | usable valuation estimate.
  |
  */

  else if (
    medianSale !== null
  ) {
    fairValue =
      medianSale;

    methodology =
      salesCount >= 5
        ? "sold_median"
        : "blended_low";
  }


  return {
    fairValue,

    medianSale,

    averageSale,

    lowestSale,

    highestSale,

    salesCount,

    methodology,
  };
}