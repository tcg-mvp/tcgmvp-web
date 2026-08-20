export type FairValueInput = {
  sales: number[];
  referencePrice: number | null;
};

export type FairValueResult = {
  fairValue: number | null;
  medianSale: number | null;
  averageSale: number | null;
  lowestSale: number | null;
  highestSale: number | null;
  salesCount: number;
  methodology:
    | "sold_median"
    | "blended_moderate"
    | "blended_low"
    | "reference_only"
    | "insufficient";
};

function calculateMedian(
  values: number[]
): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [
    ...values,
  ].sort(
    (a, b) => a - b
  );

  const middle = Math.floor(
    sorted.length / 2
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
  values: number[]
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0
    ) / values.length
  );
}

function isValidPrice(
  value: number | null
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
  const validSales = sales.filter(
    (sale) =>
      Number.isFinite(sale) &&
      sale > 0
  );

  const validReferencePrice =
    isValidPrice(referencePrice)
      ? referencePrice
      : null;

  const salesCount =
    validSales.length;

  const medianSale =
    calculateMedian(
      validSales
    );

  const averageSale =
    calculateAverage(
      validSales
    );

  const lowestSale =
    salesCount > 0
      ? Math.min(
          ...validSales
        )
      : null;

  const highestSale =
    salesCount > 0
      ? Math.max(
          ...validSales
        )
      : null;

  let fairValue: number | null = null;

  let methodology:
    FairValueResult["methodology"] =
      "insufficient";

  /*
   * Strong sold-market evidence:
   * use the verified median directly.
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
   * Moderate sold-market evidence:
   * sold evidence remains dominant,
   * with TCGPlayer acting as a stabilizer.
   */
  else if (
    salesCount >= 2 &&
    medianSale !== null &&
    validReferencePrice !== null
  ) {
    fairValue =
      medianSale * 0.7 +
      validReferencePrice * 0.3;

    methodology =
      "blended_moderate";
  }

  /*
   * Only one verified sale:
   * rely more heavily on the established
   * reference-price source.
   */
  else if (
    salesCount === 1 &&
    medianSale !== null &&
    validReferencePrice !== null
  ) {
    fairValue =
      medianSale * 0.4 +
      validReferencePrice * 0.6;

    methodology =
      "blended_low";
  }

  /*
   * No usable sold evidence:
   * fall back to reference pricing.
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
   * Allow sold evidence to stand alone if
   * reference pricing is unavailable.
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