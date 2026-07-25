export type FairValueInput = {
  sales: number[];
};

export type FairValueResult = {
  fairValue: number | null;
  medianSale: number | null;
  averageSale: number | null;
  lowestSale: number | null;
  highestSale: number |null;
  salesCount: number;
};

function calculateMedian(values: number[]) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);

  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function calculateAverage(values: number[]) {
  if (values.length === 0) return null;

  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateFairValue({
  sales,
}: FairValueInput): FairValueResult {

  if (sales.length === 0) {
    return {
      fairValue: null,
      medianSale: null,
      averageSale: null,
      lowestSale: null,
      highestSale: null,
      salesCount: 0,
    };
  }

  const medianSale = calculateMedian(sales);

  const averageSale = calculateAverage(sales);

  return {
    fairValue: medianSale,

    medianSale,

    averageSale,

    lowestSale: Math.min(...sales),

    highestSale: Math.max(...sales),

    salesCount: sales.length,
  };
}