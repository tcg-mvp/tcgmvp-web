import {
  calculateMarketAnomalyDetection,
} from "@/lib/analytics/marketAnomalyDetection";


let assertions = 0;
let failedAssertions = 0;


function assert(
  condition: boolean,
  message: string,
): void {
  assertions += 1;


  if (!condition) {
    failedAssertions +=
      1;

    throw new Error(
      message,
    );
  }
}


function runTest(
  name: string,
  test: () => void,
): boolean {
  console.log("");

  console.log(
    `TEST: ${name}`,
  );


  try {
    test();

    console.log(
      "PASS",
    );

    return true;
  } catch (
    error
  ) {
    console.log(
      "FAIL",
    );

    console.log(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );

    return false;
  }
}


const tests = [
  () =>
    runTest(
      "Stable market produces no anomalies",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              495,
              498,
              500,
              502,
              505,
              497,
              503,
            ],

            listingPrices: [
              500,
              505,
              510,
              515,
              520,
              525,
              530,
            ],
          });


        assert(
          result.anomalyScore ===
            0,
          "Stable market should produce anomaly score zero.",
        );

        assert(
          result.level ===
            "None",
          "Stable market should return None.",
        );

        assert(
          result.flags.length ===
            0,
          "Stable market should have no anomaly flags.",
        );
      },
    ),


  () =>
    runTest(
      "Extreme verified sale is detected",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              495,
              498,
              500,
              501,
              502,
              505,
              1200,
            ],

            listingPrices: [
              500,
              510,
              520,
              530,
              540,
            ],
          });


        assert(
          result.saleOutlierCount >=
            1,
          "Extreme sale should be detected as an outlier.",
        );

        assert(
          result.flags.includes(
            "SALE_OUTLIERS",
          ),
          "Expected SALE_OUTLIERS flag.",
        );

        assert(
          result.anomalyScore >
            0,
          "Detected outlier should raise anomaly score.",
        );
      },
    ),


  () =>
    runTest(
      "Extreme active listing is detected",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              500,
              505,
              510,
              515,
              520,
            ],

            listingPrices: [
              500,
              505,
              510,
              515,
              520,
              1500,
            ],
          });


        assert(
          result.listingOutlierCount >=
            1,
          "Extreme listing should be detected.",
        );

        assert(
          result.flags.includes(
            "LISTING_OUTLIERS",
          ),
          "Expected LISTING_OUTLIERS flag.",
        );
      },
    ),


  () =>
    runTest(
      "Large low-side listing discount is detected",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [],

            listingPrices: [
              250,
              500,
              510,
              520,
              530,
              540,
            ],
          });


        assert(
          result.lowestListingDiscountPercent !==
            null &&
            result.lowestListingDiscountPercent >=
              30,
          "Lowest listing should be materially below median.",
        );

        assert(
          result.flags.includes(
            "LOWEST_LISTING_DISCOUNT",
          ),
          "Expected LOWEST_LISTING_DISCOUNT flag.",
        );
      },
    ),


  () =>
    runTest(
      "Wide listing market is detected",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [],

            listingPrices: [
              400,
              450,
              500,
              600,
              700,
              800,
              900,
            ],
          });


        assert(
          result.listingSpreadPercent !==
            null &&
            result.listingSpreadPercent >=
              50,
          "Listing spread should exceed anomaly threshold.",
        );

        assert(
          result.flags.includes(
            "WIDE_LISTING_SPREAD",
          ),
          "Expected WIDE_LISTING_SPREAD flag.",
        );
      },
    ),


  () =>
    runTest(
      "Highly dispersed realized sales are detected",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              300,
              350,
              400,
              500,
              600,
              700,
              800,
            ],

            listingPrices: [],
          });


        assert(
          result.saleDispersionPercent !==
            null &&
            result.saleDispersionPercent >=
              35,
          "Sale dispersion should exceed anomaly threshold.",
        );

        assert(
          result.flags.includes(
            "HIGH_SALE_DISPERSION",
          ),
          "Expected HIGH_SALE_DISPERSION flag.",
        );
      },
    ),


  () =>
    runTest(
      "Small samples do not invent statistical outliers",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              500,
              1000,
            ],

            listingPrices: [
              500,
              1000,
            ],
          });


        assert(
          result.saleOutlierCount ===
            0,
          "Two sales are insufficient for statistical outlier classification.",
        );

        assert(
          result.listingOutlierCount ===
            0,
          "Two listings are insufficient for statistical outlier classification.",
        );
      },
    ),


  () =>
    runTest(
      "Invalid prices are ignored safely",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              500,
              -10,
              Number.NaN,
              0,
              505,
            ],

            listingPrices: [
              510,
              Number.POSITIVE_INFINITY,
              -20,
              515,
            ],
          });


        assert(
          result.saleSampleSize ===
            2,
          "Only two valid sale prices should remain.",
        );

        assert(
          result.listingSampleSize ===
            2,
          "Only two valid listing prices should remain.",
        );
      },
    ),


  () =>
    runTest(
      "No evidence returns clean unavailable sample state",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [],
            listingPrices: [],
          });


        assert(
          result.anomalyScore ===
            0,
          "No evidence should not manufacture anomaly risk.",
        );

        assert(
          result.level ===
            "None",
          "No evidence should return None anomaly level.",
        );

        assert(
          result.saleMedian ===
            null,
          "Sale median should be unavailable.",
        );

        assert(
          result.listingMedian ===
            null,
          "Listing median should be unavailable.",
        );
      },
    ),


  () =>
    runTest(
      "Multiple anomaly conditions increase severity",
      () => {
        const result =
          calculateMarketAnomalyDetection({
            salePrices: [
              300,
              400,
              500,
              600,
              700,
              800,
              2000,
            ],

            listingPrices: [
              200,
              500,
              600,
              700,
              800,
              900,
              2500,
            ],
          });


        assert(
          result.flags.length >=
            3,
          "Expected multiple anomaly flags.",
        );

        assert(
          result.anomalyScore >=
            40,
          "Multiple anomaly conditions should reach at least Moderate severity.",
        );

        assert(
          result.level ===
            "Moderate" ||
            result.level ===
              "High",
          "Multiple anomaly conditions should not remain Low.",
        );
      },
    ),
];


console.log("");

console.log(
  "=".repeat(
    78,
  ),
);

console.log(
  "TCGMVP MARKET ANOMALY DETECTION TESTS",
);

console.log(
  "=".repeat(
    78,
  ),
);


let passed = 0;
let failed = 0;


for (
  const test of tests
) {
  if (test()) {
    passed += 1;
  } else {
    failed += 1;
  }
}


console.log("");

console.log(
  "=".repeat(
    78,
  ),
);

console.log(
  "TEST SUMMARY",
);

console.log(
  "=".repeat(
    78,
  ),
);

console.log(
  `Tests: ${tests.length}`,
);

console.log(
  `Passed: ${passed}`,
);

console.log(
  `Failed: ${failed}`,
);

console.log(
  `Assertions: ${assertions}`,
);

console.log(
  `Failed assertions: ${failedAssertions}`,
);

console.log("");


if (
  failed > 0 ||
  failedAssertions > 0
) {
  console.log(
    "Market Anomaly Detection: FAIL",
  );

  process.exit(
    1,
  );
}


console.log(
  "Market Anomaly Detection: PASS",
);