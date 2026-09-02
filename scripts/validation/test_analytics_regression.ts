import {
  calculateFairValue,
} from "@/lib/analytics/fairValue";

import {
  calculateMarketHealth,
} from "@/lib/analytics/marketHealth";

import {
  calculateMarketStatistics,
} from "@/lib/analytics/marketStatistics";

import {
  calculateConfidence,
} from "@/lib/analytics/confidence";

import {
  calculateTrendAnalysis,
} from "@/lib/analytics/trendAnalysis";

import {
  calculateRiskAnalysis,
} from "@/lib/analytics/riskAnalysis";

import {
  calculatePriceTarget,
} from "@/lib/analytics/priceTarget";

import {
  calculateMarketRating,
} from "@/lib/analytics/marketRating";

import {
  calculateInvestmentOutlook,
} from "@/lib/analytics/investmentOutlook";


type Scenario = {
  name: string;

  description: string;

  currentPrice: number | null;

  price30DaysAgo: number | null;

  price52WeekLow: number | null;

  price52WeekHigh: number | null;

  entryPrice: number | null;

  sales: number[];

  activeListings: number;

  historyPoints: number;

  dataAgeDays: number;

  expectations: (
    result: ScenarioResult,
  ) => void;
};


type ScenarioResult = {
  fairValue:
    ReturnType<
      typeof calculateFairValue
    >;

  marketHealth:
    ReturnType<
      typeof calculateMarketHealth
    >;

  confidence:
    ReturnType<
      typeof calculateConfidence
    >;

  trend:
    ReturnType<
      typeof calculateTrendAnalysis
    >;

  risk:
    ReturnType<
      typeof calculateRiskAnalysis
    >;

  priceTarget:
    ReturnType<
      typeof calculatePriceTarget
    >;

  marketRating:
    ReturnType<
      typeof calculateMarketRating
    >;

  outlook:
    ReturnType<
      typeof calculateInvestmentOutlook
    >;
};


let totalAssertions = 0;
let failedAssertions = 0;


function assert(
  condition: boolean,
  message: string,
): void {
  totalAssertions += 1;

  if (!condition) {
    failedAssertions += 1;

    throw new Error(
      message,
    );
  }
}


function assertBetween(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  assert(
    Number.isFinite(
      value,
    ),
    `${label} must be finite.`,
  );

  assert(
    value >= minimum &&
      value <= maximum,
    `${label} ${value} is outside ${minimum}–${maximum}.`,
  );
}


function isoDaysAgo(
  daysAgo: number,
): string {
  return new Date(
    Date.now() -
      daysAgo *
        24 *
        60 *
        60 *
        1000,
  ).toISOString();
}


function buildPriceHistory(
  scenario: Scenario,
) {
  if (
    scenario.currentPrice ===
      null ||
    scenario.historyPoints <= 0
  ) {
    return [];
  }


  const history: {
    price: number;
    recorded_at: string;
  }[] = [];


  const low =
    scenario.price52WeekLow ??
    scenario.currentPrice;


  const high =
    scenario.price52WeekHigh ??
    scenario.currentPrice;


  /*
   * The synthetic "current" observation may
   * itself be stale.
   *
   * Every earlier observation must therefore
   * be positioned relative to that observation,
   * not relative to today.
   */
  const currentAgeDays =
    Math.max(
      0,
      scenario.dataAgeDays,
    );


  /*
   * The explicit 30-day comparison point is
   * intentionally placed 31 days before the
   * scenario's current observation.
   *
   * Generated historical observations are kept
   * older than this point so calculateMarketStatistics()
   * cannot accidentally select a generated value
   * for the 30-day comparison.
   */
  const comparisonAgeDays =
    currentAgeDays +
    31;


  const generatedHistoryStart =
    comparisonAgeDays +
    2;


  const oldestAgeDays =
    currentAgeDays +
    Math.max(
      365,
      scenario.historyPoints,
    );


  for (
    let index = 0;
    index <
    scenario.historyPoints;
    index += 1
  ) {
    const progress =
      scenario.historyPoints === 1
        ? 1
        : index /
          (
            scenario.historyPoints -
            1
          );


    const daysAgo =
      Math.round(
        oldestAgeDays -
        (
          oldestAgeDays -
          generatedHistoryStart
        ) *
          progress,
      );


    /*
     * Produce historical observations across
     * the requested range without interfering
     * with the controlled 30-day observation.
     */
    const wave =
      (
        Math.sin(
          index / 8,
        ) +
        1
      ) /
      2;


    const price =
      low +
      (
        high -
        low
      ) *
        wave;


    history.push({
      price,

      recorded_at:
        isoDaysAgo(
          daysAgo,
        ),
    });
  }


  /*
   * Explicit controlled 30-day comparison.
   */
  if (
    scenario.price30DaysAgo !==
    null
  ) {
    history.push({
      price:
        scenario.price30DaysAgo,

      recorded_at:
        isoDaysAgo(
          comparisonAgeDays,
        ),
    });
  }


  /*
   * Explicit current observation.
   */
  history.push({
    price:
      scenario.currentPrice,

    recorded_at:
      isoDaysAgo(
        currentAgeDays,
      ),
  });


  return history.sort(
    (
      a,
      b,
    ) =>
      new Date(
        a.recorded_at,
      ).getTime() -
      new Date(
        b.recorded_at,
      ).getTime(),
  );
}

function buildSales(
  sales: number[],
) {
  return sales.map(
    (
      price,
      index,
    ) => ({
      total_price:
        price,

      sale_price:
        price,

      shipping_price:
        0,

      sold_at:
        isoDaysAgo(
          Math.min(
            index + 1,
            29,
          ),
        ),

      is_verified:
        true,
    }),
  );
}


function runScenario(
  scenario: Scenario,
): ScenarioResult {
  const priceHistory =
    buildPriceHistory(
      scenario,
    );


  const sales =
    buildSales(
      scenario.sales,
    );


  const fairValue =
    calculateFairValue({
      sales:
        scenario.sales,

      referencePrice:
        scenario.currentPrice,
    });


  const marketHealth =
    calculateMarketHealth({
      sales:
        scenario.sales,

      listings:
        Array.from(
          {
            length:
              scenario.activeListings,
          },
          () =>
            scenario.entryPrice ??
            scenario.currentPrice ??
            100,
        ),

      activeListingsCount:
        scenario.activeListings,
    });


  const statistics =
    calculateMarketStatistics(
      priceHistory,
      sales,
    );


  const confidence =
    calculateConfidence({
      recentSalesCount:
        scenario.sales.length,

      activeListingsCount:
        scenario.activeListings,

      priceHistoryPoints:
        priceHistory.length,

      hasCurrentPrice:
        scenario.currentPrice !==
        null,

      hasFairValue:
        fairValue.fairValue !==
        null,

      dataAgeDays:
        scenario.dataAgeDays,
    });


  const trend =
    calculateTrendAnalysis(
      statistics,
      confidence,
    );


  const risk =
    calculateRiskAnalysis({
      statistics,

      trendAnalysis:
        trend,

      marketConfidence:
        confidence,

      fairValue:
        fairValue.fairValue,

      entryPrice:
        scenario.entryPrice,

      activeListingsCount:
        scenario.activeListings,
    });


  const priceTarget =
    calculatePriceTarget({
      referencePrice:
        scenario.currentPrice,

      entryPrice:
        scenario.entryPrice,

      fairValue:
        fairValue.fairValue,

      trendScore:
        trend.strength,

      riskScore:
        risk.riskScore,

      marketConfidenceScore:
        confidence.score,

      marketConfidence:
        confidence.confidence,
    });


  const marketRating =
    calculateMarketRating({
      entryPrice:
        scenario.entryPrice,

      trendAnalysis:
        trend,

      riskAnalysis:
        risk,

      fairValue,

      marketHealth,

      marketConfidenceScore:
        confidence.score,

      marketConfidence:
        confidence.confidence,
    });


  const outlook =
    calculateInvestmentOutlook({
      referencePrice:
        scenario.currentPrice,

      entryPrice:
        scenario.entryPrice,

      fairValue:
        fairValue.fairValue,

      marketRatingScore:
        marketRating.ratingScore,

      trendScore:
        trend.strength,

      riskScore:
        risk.riskScore,

      marketHealthScore:
        marketHealth.score ??
        0,

      expectedReturnPercent:
        priceTarget
          .potentialUpsidePercent,

      recentSalesCount:
        scenario.sales.length,

      activeListingsCount:
        scenario.activeListings,

      marketConfidenceScore:
        confidence.score,

      marketConfidence:
        confidence.confidence,

      change30d:
        statistics.change30d,
    });


  /*
   * Universal contracts.
   */
  assertBetween(
    confidence.score,
    0,
    95,
    "Confidence",
  );

  assertBetween(
    trend.strength,
    0,
    100,
    "Trend",
  );

  assertBetween(
    risk.riskScore,
    0,
    100,
    "Risk",
  );

  assertBetween(
    marketRating.ratingScore,
    0,
    100,
    "Market Rating",
  );

  assertBetween(
    outlook.overallScore,
    0,
    100,
    "Outlook",
  );


  if (
    priceTarget
      .targetAdjustmentPercent !==
    null
  ) {
    assertBetween(
      priceTarget
        .targetAdjustmentPercent,
      -15,
      20,
      "Target adjustment",
    );
  }


  scenario.expectations({
    fairValue,
    marketHealth,
    confidence,
    trend,
    risk,
    priceTarget,
    marketRating,
    outlook,
  });


  return {
    fairValue,
    marketHealth,
    confidence,
    trend,
    risk,
    priceTarget,
    marketRating,
    outlook,
  };
}


const scenarios: Scenario[] = [
  {
    name:
      "High liquidity, undervalued, bullish",

    description:
      "Deep sales, deep listings, positive momentum, and entry below Fair Value.",

    currentPrice:
      500,

    price30DaysAgo:
      450,

    price52WeekLow:
      350,

    price52WeekHigh:
      510,

    entryPrice:
      440,

    sales:
      [
        490,
        500,
        510,
        495,
        505,
        500,
        498,
        502,
        510,
        495,
        500,
        505,
        490,
        500,
        510,
        498,
        502,
        505,
        495,
        500,
        510,
        500,
        495,
        505,
        500,
      ],

    activeListings:
      25,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.fairValue
            .fairValue !==
            null,
          "Fair Value should exist.",
        );

        assert(
          result.confidence
            .confidence ===
            "High",
          "Evidence-rich scenario should have High confidence.",
        );

        assert(
          result.trend
            .strength >=
            65,
          "Bullish scenario should have bullish trend strength.",
        );

        assert(
          result.priceTarget
            .targetPrice !==
            null,
          "Price Target should exist.",
        );

        assert(
          result.marketRating
            .valuationScore !==
            null,
          "Valuation should participate in Market Rating.",
        );
      },
  },


  {
    name:
      "High liquidity, overpriced, bearish",

    description:
      "Strong evidence but declining price and actionable entry well above Fair Value.",

    currentPrice:
      400,

    price30DaysAgo:
      475,

    price52WeekLow:
      380,

    price52WeekHigh:
      600,

    entryPrice:
      510,

    sales:
      [
        400,
        405,
        395,
        410,
        400,
        398,
        402,
        405,
        395,
        400,
        405,
        400,
        398,
        402,
        395,
        400,
        405,
        398,
        402,
        400,
      ],

    activeListings:
      30,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.trend
            .strength <
            50,
          "Bearish scenario should score below neutral trend.",
        );

        assert(
          result.risk
            .valuationRiskScore !==
            null,
          "Valuation risk should be measurable.",
        );

        assert(
          (
            result.risk
              .valuationRiskScore ??
            0
          ) >= 65,
          "Overpriced entry should create elevated valuation risk.",
        );

        assert(
          result.priceTarget
            .potentialUpsidePercent !==
            null &&
            result.priceTarget
              .potentialUpsidePercent <
              0,
          "Overpriced entry should show negative expected return.",
        );
      },
  },


  {
    name:
      "Low liquidity, strong trend",

    description:
      "Very few sales but strong upward price movement.",

    currentPrice:
      1000,

    price30DaysAgo:
      850,

    price52WeekLow:
      700,

    price52WeekHigh:
      1020,

    entryPrice:
      980,

    sales:
      [
        970,
        990,
      ],

    activeListings:
      3,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.trend
            .strength >=
            65,
          "Strong momentum should remain directionally bullish.",
        );

        assert(
          result.confidence
            .confidence !==
            "High",
          "Sparse market should not receive High confidence.",
        );

        assert(
          result.risk
            .liquidityRiskScore !==
            null &&
            result.risk
              .liquidityRiskScore >=
              60,
          "Sparse transactions should create elevated liquidity risk.",
        );
      },
  },


  {
    name:
      "Weak trend, attractive valuation",

    description:
      "Entry is attractive relative to sales but momentum is negative.",

    currentPrice:
      500,

    price30DaysAgo:
      560,

    price52WeekLow:
      450,

    price52WeekHigh:
      650,

    entryPrice:
      430,

    sales:
      [
        500,
        510,
        495,
        505,
        500,
        510,
        500,
        495,
        505,
        500,
      ],

    activeListings:
      15,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.trend
            .strength <
            50,
          "Negative momentum should remain bearish/weak.",
        );

        assert(
          result.marketRating
            .valuationDifferencePercent !==
            null &&
            result.marketRating
              .valuationDifferencePercent >
              3,
          "Entry should show positive valuation advantage.",
        );

        assert(
          result.marketRating
            .ratingScore <
            90,
          "Attractive valuation must not automatically create an Exceptional rating.",
        );
      },
  },


  {
    name:
      "No verified sales",

    description:
      "Reference price and listings exist, but no completed-sale evidence.",

    currentPrice:
      300,

    price30DaysAgo:
      290,

    price52WeekLow:
      250,

    price52WeekHigh:
      330,

    entryPrice:
      295,

    sales:
      [],

    activeListings:
      25,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.fairValue
            .fairValue ===
            null,
          "Fair Value must be unavailable without verified sales.",
        );

        assert(
          result.marketHealth
            .score ===
            null,
          "Market Health must be unavailable without verified sales.",
        );

        assert(
          result.risk
            .liquidityRiskScore ===
            null,
          "Liquidity risk must remain unmeasured without sales.",
        );

        assert(
          result.priceTarget
            .targetPrice ===
            null,
          "Price Target must be unavailable.",
        );

        assert(
          result.priceTarget
            .verdict ===
            "Unrated",
          "Price Target must be Unrated.",
        );

        assert(
          result.outlook
            .overallOutlook ===
            "Unknown",
          "Investment Outlook must be Unknown.",
        );

        assert(
          result.marketRating
            .valuationScore ===
            null,
          "Market Rating must exclude valuation.",
        );
      },
  },


  {
    name:
      "No active listings",

    description:
      "Verified transactions and history exist, but no actionable current listings.",

    currentPrice:
      500,

    price30DaysAgo:
      490,

    price52WeekLow:
      400,

    price52WeekHigh:
      550,

    entryPrice:
      null,

    sales:
      [
        490,
        500,
        510,
        495,
        505,
        500,
      ],

    activeListings:
      0,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.fairValue
            .fairValue !==
            null,
          "Fair Value should still exist from realized transactions.",
        );

        assert(
          result.marketRating
            .valuationScore ===
            null,
          "Market Rating valuation should be excluded without an actionable entry.",
        );

        assert(
          result.priceTarget
            .targetPrice ===
            null,
          "Price Target requires actionable entry price.",
        );

        assert(
          result.priceTarget
            .verdict ===
            "Unrated",
          "Price Target should be Unrated without entry price.",
        );
      },
  },


  {
    name:
      "Stale market data",

    description:
      "Market evidence exists but the newest observation is materially stale.",

    currentPrice:
      500,

    price30DaysAgo:
      490,

    price52WeekLow:
      400,

    price52WeekHigh:
      550,

    entryPrice:
      500,

    sales:
      [
        495,
        500,
        505,
        500,
        495,
      ],

    activeListings:
      10,

    historyPoints:
      365,

    dataAgeDays:
      120,

    expectations:
      (
        result,
      ) => {
        assert(
          result.confidence
            .score <
            95,
          "Stale evidence should reduce confidence from maximum.",
        );

        assert(
          result.confidence
            .reasons.some(
              (
                reason,
              ) =>
                reason
                  .toLowerCase()
                  .includes(
                    "stale",
                  ),
            ),
          "Confidence explanation should mention stale data.",
        );
      },
  },


  {
    name:
      "Extreme sale outlier",

    description:
      "One extreme verified sale appears inside an otherwise stable transaction sample.",

    currentPrice:
      500,

    price30DaysAgo:
      500,

    price52WeekLow:
      450,

    price52WeekHigh:
      550,

    entryPrice:
      500,

    sales:
      [
        490,
        495,
        500,
        505,
        510,
        5000,
      ],

    activeListings:
      15,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.fairValue
            .methodology ===
            "sold_median",
          "Deep transaction sample should use median Fair Value.",
        );

        assert(
          result.fairValue
            .fairValue !==
            null &&
            result.fairValue
              .fairValue <
              1000,
          "Median Fair Value should resist the extreme transaction outlier.",
        );

        assert(
          result.marketHealth
            .priceStabilityScore !==
            null &&
            result.marketHealth
              .priceStabilityScore <=
              30,
          "Extreme realized-price dispersion should reduce price stability.",
        );
      },
  },


  {
    name:
      "Conflicting bullish trend and high risk",

    description:
      "Strong price momentum coexists with volatile history, sparse transactions, and weak liquidity.",

    currentPrice:
      1000,

    price30DaysAgo:
      800,

    price52WeekLow:
      400,

    price52WeekHigh:
      1050,

    entryPrice:
      990,

    sales:
      [
        980,
        1000,
      ],

    activeListings:
      2,

    historyPoints:
      365,

    dataAgeDays:
      0,

    expectations:
      (
        result,
      ) => {
        assert(
          result.trend
            .strength >=
            65,
          "Trend should remain bullish.",
        );

        assert(
          result.risk
            .riskScore >=
            50,
          "Conflicting scenario should retain meaningful risk.",
        );

        assert(
          result.marketRating
            .ratingScore <
            90,
          "Bullish momentum alone must not create an Exceptional Market Rating.",
        );
      },
  },
];


function printScenarioResult(
  scenario: Scenario,
  result: ScenarioResult,
): void {
  console.log(
    `  Confidence: ${result.confidence.confidence} (${result.confidence.score})`,
  );

  console.log(
    `  Trend: ${result.trend.trend} (${result.trend.strength})`,
  );

  console.log(
    `  Risk: ${result.risk.overallRisk} (${result.risk.riskScore})`,
  );

  console.log(
    `  Fair Value: ${
      result.fairValue
        .fairValue ===
      null
        ? "N/A"
        : `$${result.fairValue.fairValue.toFixed(
            2,
          )}`
    }`,
  );

  console.log(
    `  Market Rating: ${result.marketRating.rating} (${result.marketRating.ratingScore})`,
  );

  console.log(
    `  Price Target: ${
      result.priceTarget
        .targetPrice ===
      null
        ? "N/A"
        : `$${result.priceTarget.targetPrice.toFixed(
            2,
          )}`
    } — ${result.priceTarget.verdict}`,
  );

  console.log(
    `  Outlook: ${result.outlook.overallOutlook} (${result.outlook.overallScore})`,
  );

  console.log(
    "  PASS",
  );
}


function main(): void {
  console.log("");
  console.log(
    "=".repeat(
      78,
    ),
  );

  console.log(
    "TCGMVP ANALYTICS REGRESSION SUITE",
  );

  console.log(
    "=".repeat(
      78,
    ),
  );


  let scenariosPassed = 0;
  let scenariosFailed = 0;


  for (
    let index = 0;
    index <
    scenarios.length;
    index += 1
  ) {
    const scenario =
      scenarios[index];


    console.log("");
    console.log(
      "-".repeat(
        78,
      ),
    );

    console.log(
      `[${index + 1}/${scenarios.length}] ${scenario.name}`,
    );

    console.log(
      scenario.description,
    );

    console.log(
      "-".repeat(
        78,
      ),
    );


    try {
      const result =
        runScenario(
          scenario,
        );

      scenariosPassed +=
        1;

      printScenarioResult(
        scenario,
        result,
      );
    } catch (
      error
    ) {
      scenariosFailed +=
        1;

      console.log(
        "  FAIL",
      );

      console.log(
        `  ${
          error instanceof
          Error
            ? error.message
            : String(
                error,
              )
        }`,
      );
    }
  }


  console.log("");
  console.log(
    "=".repeat(
      78,
    ),
  );

  console.log(
    "REGRESSION SUMMARY",
  );

  console.log(
    "=".repeat(
      78,
    ),
  );

  console.log(
    `Scenarios: ${scenarios.length}`,
  );

  console.log(
    `Passed: ${scenariosPassed}`,
  );

  console.log(
    `Failed: ${scenariosFailed}`,
  );

  console.log(
    `Assertions: ${totalAssertions}`,
  );

  console.log(
    `Failed assertions: ${failedAssertions}`,
  );

  console.log("");


  if (
    scenariosFailed >
      0 ||
    failedAssertions >
      0
  ) {
    console.log(
      "Analytics Regression: FAIL",
    );

    process.exit(
      1,
    );
  }


  console.log(
    "Analytics Regression: PASS",
  );
}


main();