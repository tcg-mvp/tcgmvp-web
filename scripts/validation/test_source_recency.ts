import {
  calculateSourceRecency,
} from "@/lib/analytics/sourceRecency";


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


const NOW =
  "2026-09-02T12:00:00Z";


const tests = [
  () =>
    runTest(
      "All market sources are fresh",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-09-02T00:00:00Z",

            soldObservedAt:
              "2026-08-30T00:00:00Z",

            activeObservedAt:
              "2026-09-02T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.score ===
            100,
          "All fresh sources should produce 100.",
        );

        assert(
          result.label ===
            "Fresh",
          "Expected Fresh overall recency.",
        );

        assert(
          result.staleSignals.length ===
            0,
          "No sources should be stale.",
        );
      },
    ),


  () =>
    runTest(
      "Ten-day-old sold evidence remains recent",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-09-02T00:00:00Z",

            soldObservedAt:
              "2026-08-23T00:00:00Z",

            activeObservedAt:
              "2026-09-02T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.sold.ageDays ===
            10,
          "Expected sold evidence age of 10 days.",
        );

        assert(
          result.sold.label ===
            "Recent",
          "Ten-day-old sold evidence should remain Recent.",
        );

        assert(
          result.sold.score ===
            90,
          "Ten-day-old sold evidence should score 90.",
        );

        assert(
          result.label ===
            "Fresh" ||
            result.label ===
              "Recent",
          "Overall market freshness should remain strong.",
        );
      },
    ),


  () =>
    runTest(
      "Ten-day-old active listings are aging",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-09-02T00:00:00Z",

            soldObservedAt:
              null,

            activeObservedAt:
              "2026-08-23T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.active.ageDays ===
            10,
          "Expected active evidence age of 10 days.",
        );

        assert(
          result.active.label ===
            "Aging",
          "Ten-day-old active market evidence should be Aging.",
        );

        assert(
          result.active.score ===
            70,
          "Expected active freshness score of 70.",
        );
      },
    ),


  () =>
    runTest(
      "Stale reference market is identified",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-08-10T00:00:00Z",

            soldObservedAt:
              null,

            activeObservedAt:
              "2026-09-02T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.reference.label ===
            "Stale",
          "Reference evidence should be stale.",
        );

        assert(
          result.staleSignals.includes(
            "reference",
          ),
          "Reference source should be included in staleSignals.",
        );
      },
    ),


  () =>
    runTest(
      "Stale active market is identified",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-09-02T00:00:00Z",

            soldObservedAt:
              null,

            activeObservedAt:
              "2026-08-01T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.active.label ===
            "Very Stale",
          "Active market should be Very Stale.",
        );

        assert(
          result.staleSignals.includes(
            "active",
          ),
          "Active source should be marked stale.",
        );
      },
    ),


  () =>
    runTest(
      "Thirty-five-day-old sold evidence is stale",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              null,

            soldObservedAt:
              "2026-07-29T00:00:00Z",

            activeObservedAt:
              null,

            now:
              NOW,
          });


        assert(
          result.sold.label ===
            "Stale",
          "35-day-old realized-sale evidence should be stale.",
        );

        assert(
          result.sold.score ===
            40,
          "Expected stale sold score of 40.",
        );
      },
    ),


  () =>
    runTest(
      "Missing sold timestamp is unavailable not stale",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              "2026-09-02T00:00:00Z",

            soldObservedAt:
              null,

            activeObservedAt:
              "2026-09-02T00:00:00Z",

            now:
              NOW,
          });


        assert(
          result.sold.label ===
            "Unavailable",
          "Missing sold timestamp should be Unavailable.",
        );

        assert(
          !result.staleSignals.includes(
            "sold",
          ),
          "Missing sold evidence must not be classified as stale.",
        );

        assert(
          result.score ===
            100,
          "Missing sold evidence should not reduce available-source freshness.",
        );
      },
    ),


  () =>
    runTest(
      "All timestamps unavailable",
      () => {
        const result =
          calculateSourceRecency({
            referenceObservedAt:
              null,

            soldObservedAt:
              null,

            activeObservedAt:
              null,

            now:
              NOW,
          });


        assert(
          result.score ===
            null,
          "No timestamps should produce no freshness score.",
        );

        assert(
          result.label ===
            "Unavailable",
          "No timestamps should produce Unavailable freshness.",
        );

        assert(
          result.signalsWithTimestamps ===
            0,
          "Expected zero timestamped signals.",
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
  "TCGMVP SOURCE RECENCY TESTS",
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
    "Source Recency: FAIL",
  );

  process.exit(
    1,
  );
}


console.log(
  "Source Recency: PASS",
);