import {
  calculateSourceEvidenceQuality,
} from "@/lib/analytics/sourceEvidenceQuality";


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
      "Deep evidence across every source",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              40,

            activeListingsCount:
              30,

            historyPoints:
              900,

            crossSourceComparisons:
              3,
          });


        assert(
          result.score ===
            100,
          "Deep evidence should score 100.",
        );

        assert(
          result.label ===
            "Excellent",
          "Deep evidence should be Excellent.",
        );

        assert(
          result.salesDepthScore ===
            100,
          "Sales depth should score 100.",
        );

        assert(
          result.listingDepthScore ===
            100,
          "Listing depth should score 100.",
        );

        assert(
          result.historyDepthScore ===
            100,
          "History depth should score 100.",
        );

        assert(
          result.crossSourceDepthScore ===
            100,
          "Cross-source depth should score 100.",
        );
      },
    ),


  () =>
    runTest(
      "Five verified sales create usable realized evidence",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              5,

            activeListingsCount:
              10,

            historyPoints:
              500,

            crossSourceComparisons:
              3,
          });


        assert(
          result.salesDepthScore ===
            65,
          "Five verified sales should score 65.",
        );

        assert(
          result.score >=
            60,
          "Usable evidence should produce a meaningful overall score.",
        );
      },
    ),


  () =>
    runTest(
      "One verified sale remains thin",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              1,

            activeListingsCount:
              20,

            historyPoints:
              500,

            crossSourceComparisons:
              3,
          });


        assert(
          result.salesDepthScore ===
            20,
          "One verified sale should remain thin evidence.",
        );

        assert(
          result.score <
            85,
          "One sale should prevent Excellent overall evidence quality.",
        );
      },
    ),


  () =>
    runTest(
      "No sold evidence does not erase strong supporting evidence",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              0,

            activeListingsCount:
              30,

            historyPoints:
              900,

            crossSourceComparisons:
              1,
          });


        assert(
          result.salesDepthScore ===
            0,
          "No verified sales should score zero for realized-sale depth.",
        );

        assert(
          result.listingDepthScore ===
            100,
          "Deep listings should still receive full listing depth.",
        );

        assert(
          result.historyDepthScore ===
            100,
          "Deep history should still receive full history depth.",
        );

        assert(
          result.score >
            30,
          "Strong supporting evidence should prevent total evidence collapse.",
        );

        assert(
          result.score <
            70,
          "Missing realized sales should prevent Strong evidence quality.",
        );
      },
    ),


  () =>
    runTest(
      "Three active listings are thin",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              10,

            activeListingsCount:
              3,

            historyPoints:
              500,

            crossSourceComparisons:
              3,
          });


        assert(
          result.listingDepthScore ===
            40,
          "Three listings should produce thin active-market depth.",
        );

        assert(
          result.score <
            90,
          "Thin listing depth should reduce overall evidence quality.",
        );
      },
    ),


  () =>
    runTest(
      "Large historical depth receives full credit",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              5,

            activeListingsCount:
              10,

            historyPoints:
              938,

            crossSourceComparisons:
              3,
          });


        assert(
          result.historyDepthScore ===
            100,
          "More than one year of observations should receive full history depth.",
        );
      },
    ),


  () =>
    runTest(
      "Two market signals create one cross-source comparison",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              0,

            activeListingsCount:
              20,

            historyPoints:
              900,

            crossSourceComparisons:
              1,
          });


        assert(
          result.crossSourceDepthScore ===
            60,
          "One comparison should receive partial cross-source depth credit.",
        );

        assert(
          result.score ===
            54,
          "Expected evidence quality score of 54.",
        );

        assert(
          result.label ===
            "Moderate",
          "Expected Moderate evidence quality.",
        );
      },
    ),


  () =>
    runTest(
      "Three market signals create full comparison depth",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              5,

            activeListingsCount:
              5,

            historyPoints:
              900,

            crossSourceComparisons:
              3,
          });


        assert(
          result.crossSourceDepthScore ===
            100,
          "Three comparisons should receive full cross-source depth credit.",
        );
      },
    ),


  () =>
    runTest(
      "No evidence produces insufficient quality",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              0,

            activeListingsCount:
              0,

            historyPoints:
              0,

            crossSourceComparisons:
              0,
          });


        assert(
          result.score ===
            0,
          "No evidence should produce zero evidence-quality score.",
        );

        assert(
          result.label ===
            "Insufficient",
          "No evidence should be Insufficient.",
        );
      },
    ),


  () =>
    runTest(
      "Negative and invalid counts normalize safely",
      () => {
        const result =
          calculateSourceEvidenceQuality({
            verifiedSalesCount:
              -10,

            activeListingsCount:
              Number.NaN,

            historyPoints:
              -5,

            crossSourceComparisons:
              -1,
          });


        assert(
          result.score ===
            0,
          "Invalid counts should normalize to zero.",
        );

        assert(
          result.verifiedSalesCount ===
            0,
          "Negative sales should normalize to zero.",
        );

        assert(
          result.activeListingsCount ===
            0,
          "NaN listings should normalize to zero.",
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
  "TCGMVP SOURCE EVIDENCE QUALITY TESTS",
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
    "Source Evidence Quality: FAIL",
  );

  process.exit(
    1,
  );
}


console.log(
  "Source Evidence Quality: PASS",
);