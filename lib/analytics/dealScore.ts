export type DealScoreInput = {
  /**
   * TCGMVP estimated Fair Value.
   *
   * Null means there is not enough realized-sale
   * evidence to produce a transaction-supported
   * valuation.
   */
  fairMarketValue:
    number | null;

  /**
   * Current actionable price being evaluated.
   *
   * On the product-level page, this should normally
   * be the best available actionable entry price.
   *
   * For a specific listing/deal evaluator, this can
   * instead be that individual listing price.
   */
  listingPrice:
    number | null;
};


export type DealScoreLabel =
  | "Exceptional Deal"
  | "Strong Deal"
  | "Good Deal"
  | "Slightly Below Market"
  | "Fair Market Price"
  | "Overpriced"
  | "Poor Value";


export type DealScoreResult = {
  /**
   * Opportunity score from 0–100.
   *
   * 50 represents approximately Fair Value.
   * Higher = more attractive valuation.
   * Lower = increasingly expensive versus Fair Value.
   */
  score: number;

  label: DealScoreLabel;

  /**
   * Positive:
   * current price is below Fair Value.
   *
   * Negative:
   * current price is above Fair Value.
   */
  discountPercent: number;

  /**
   * Deal Score is intentionally valuation-only,
   * therefore priceScore === score.
   */
  priceScore: number;
};


function clamp(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
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


function getDealLabel(
  score: number,
): DealScoreLabel {
  if (score >= 90) {
    return "Exceptional Deal";
  }

  if (score >= 80) {
    return "Strong Deal";
  }

  if (score >= 70) {
    return "Good Deal";
  }

  if (score >= 60) {
    return "Slightly Below Market";
  }

  if (score >= 45) {
    return "Fair Market Price";
  }

  if (score >= 30) {
    return "Overpriced";
  }

  return "Poor Value";
}


export function calculateDealScore({
  fairMarketValue,
  listingPrice,
}: DealScoreInput): DealScoreResult | null {
  /*
   * Deal Score requires both:
   *
   * - a transaction-supported TCGMVP Fair Value
   * - a valid actionable entry price
   *
   * If either is unavailable, returning null is
   * more accurate than manufacturing a valuation
   * score from incomplete evidence.
   */
  if (
    fairMarketValue === null ||
    listingPrice === null ||
    !Number.isFinite(
      fairMarketValue,
    ) ||
    !Number.isFinite(
      listingPrice,
    ) ||
    fairMarketValue <= 0 ||
    listingPrice <= 0
  ) {
    return null;
  }


  /*
   * Valuation gap.
   *
   * Examples:
   *
   * Fair Value: $100
   * Price:      $90
   * Discount:   +10%
   *
   * Fair Value: $100
   * Price:      $110
   * Discount:   -10%
   */
  const discountPercent =
    (
      (
        fairMarketValue -
        listingPrice
      ) /
      fairMarketValue
    ) *
    100;


  /*
   * TCGMVP Deal Score v2
   *
   * Fair Value       = 50
   * 5% below FV      = 65
   * 10% below FV     = 80
   * 15% below FV     = 95
   *
   * 5% above FV      = 35
   * 10% above FV     = 20
   * 15% above FV     = 5
   *
   * Scores are bounded between 0 and 100.
   *
   * Liquidity and confidence remain intentionally
   * separate market characteristics.
   */
  const rawPriceScore =
    50 +
    discountPercent * 3;


  const priceScore =
    Math.round(
      clamp(
        rawPriceScore,
      ),
    );


  return {
    score:
      priceScore,

    label:
      getDealLabel(
        priceScore,
      ),

    discountPercent:
      roundPercent(
        discountPercent,
      ),

    priceScore,
  };
}