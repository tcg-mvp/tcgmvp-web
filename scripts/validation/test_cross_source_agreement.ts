import {
  calculateCrossSourceAgreement,
} from "@/lib/analytics/crossSourceAgreement";


let assertions = 0;
let failures = 0;


function assert(
  condition: boolean,
  message: string,
): void {
  assertions += 1;

  if (!condition) {
    failures += 1;

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
      "All three signals closely agree",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              500,

            soldMedianPrice:
              510,

            activeMedianPrice:
              505,
          });


        assert(
          result.score !==
            null &&
            result.score >= 85,
          "Closely aligned signals should produce strong agreement.",
        );

        assert(
          result.agreement ===
            "Strong",
          "Expected Strong agreement.",
        );

        assert(
          result.signalsAvailable ===
            3,
          "Expected all three signals.",
        );

        assert(
          result.comparisonsAvailable ===
            3,
          "Expected three comparisons.",
        );
      },
    ),


  () =>
    runTest(
      "Reference and sold prices diverge materially",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              500,

            soldMedianPrice:
              650,

            activeMedianPrice:
              640,
          });


        assert(
          result.score !==
            null &&
            result.score < 65,
          "Material divergence should not receive strong/moderate agreement.",
        );

        assert(
          result.referenceVsSoldPercent !==
            null &&
            result.referenceVsSoldPercent >
              20,
          "Reference versus sold divergence should exceed 20%.",
        );
      },
    ),


  () =>
    runTest(
      "Active asks far above realized sales",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              500,

            soldMedianPrice:
              505,

            activeMedianPrice:
              700,
          });


        assert(
          result.soldVsActivePercent !==
            null &&
            result.soldVsActivePercent >
              30,
          "Active market should show substantial divergence from sales.",
        );

        assert(
          result.score !==
            null &&
            result.score <
              85,
          "Large active-market divergence should prevent Strong agreement.",
        );
      },
    ),


  () =>
    runTest(
      "Two signals agree and sold data is unavailable",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              500,

            soldMedianPrice:
              null,

            activeMedianPrice:
              510,
          });


        assert(
          result.score !==
            null,
          "Two available signals should produce an agreement score.",
        );

        assert(
          result.agreement ===
            "Strong",
          "Closely aligned available signals should still show Strong agreement.",
        );

        assert(
          result.signalsAvailable ===
            2,
          "Expected two available signals.",
        );

        assert(
          result.comparisonsAvailable ===
            1,
          "Two signals should produce one pairwise comparison.",
        );
      },
    ),


  () =>
    runTest(
      "Only one market signal is available",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              500,

            soldMedianPrice:
              null,

            activeMedianPrice:
              null,
          });


        assert(
          result.score ===
            null,
          "One signal cannot establish agreement.",
        );

        assert(
          result.agreement ===
            "Unavailable",
          "One signal should return Unavailable.",
        );

        assert(
          result.signalsAvailable ===
            1,
          "Expected one market signal.",
        );

        assert(
          result.comparisonsAvailable ===
            0,
          "Expected zero comparisons.",
        );
      },
    ),


  () =>
    runTest(
      "No market signals are available",
      () => {
        const result =
          calculateCrossSourceAgreement({
            referencePrice:
              null,

            soldMedianPrice:
              null,

            activeMedianPrice:
              null,
          });


        assert(
          result.score ===
            null,
          "No signals should produce null score.",
        );

        assert(
          result.agreement ===
            "Unavailable",
          "No signals should produce Unavailable agreement.",
        );

        assert(
          result.signalsAvailable ===
            0,
          "Expected zero signals.",
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
  "TCGMVP CROSS-SOURCE AGREEMENT TESTS",
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
  `Failed assertions: ${failures}`,
);

console.log("");


if (
  failed > 0 ||
  failures > 0
) {
  console.log(
    "Cross-Source Agreement: FAIL",
  );

  process.exit(
    1,
  );
}


console.log(
  "Cross-Source Agreement: PASS",
);