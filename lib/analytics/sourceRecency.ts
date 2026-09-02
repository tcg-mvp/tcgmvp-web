export type SourceRecencyLabel =
  | "Fresh"
  | "Recent"
  | "Aging"
  | "Stale"
  | "Very Stale"
  | "Unavailable";


export type MarketSourceType =
  | "reference"
  | "sold"
  | "active";


export type SourceRecencyObservation = {
  source:
    MarketSourceType;

  observedAt:
    string | null;
};


export type SourceRecencyDetail = {
  source:
    MarketSourceType;

  observedAt:
    string | null;

  ageDays:
    number | null;

  score:
    number | null;

  label:
    SourceRecencyLabel;
};


export type SourceRecencyInput = {
  referenceObservedAt:
    string | null;

  soldObservedAt:
    string | null;

  activeObservedAt:
    string | null;

  now?:
    string | Date;
};


export type SourceRecencyResult = {
  score:
    number | null;

  label:
    SourceRecencyLabel;

  reference:
    SourceRecencyDetail;

  sold:
    SourceRecencyDetail;

  active:
    SourceRecencyDetail;

  signalsWithTimestamps:
    number;

  staleSignals:
    MarketSourceType[];

  reasons:
    string[];
};


function calculateAgeDays(
  observedAt:
    string | null,

  now:
    Date,
): number | null {
  if (!observedAt) {
    return null;
  }


  const observed =
    new Date(
      observedAt,
    );


  if (
    !Number.isFinite(
      observed.getTime(),
    )
  ) {
    return null;
  }


  const differenceMs =
    now.getTime() -
    observed.getTime();


  /*
   * Future timestamps are treated as age zero.
   */
  return Math.max(
    0,
    Math.floor(
      differenceMs /
        (
          24 *
          60 *
          60 *
          1000
        ),
    ),
  );
}


function getReferenceOrActiveRecency(
  ageDays: number,
): {
  score: number;
  label:
    Exclude<
      SourceRecencyLabel,
      "Unavailable"
    >;
} {
  if (ageDays <= 2) {
    return {
      score: 100,
      label: "Fresh",
    };
  }


  if (ageDays <= 7) {
    return {
      score: 90,
      label: "Recent",
    };
  }


  if (ageDays <= 14) {
    return {
      score: 70,
      label: "Aging",
    };
  }


  if (ageDays <= 30) {
    return {
      score: 40,
      label: "Stale",
    };
  }


  return {
    score: 10,
    label: "Very Stale",
  };
}


function getSoldRecency(
  ageDays: number,
): {
  score: number;
  label:
    Exclude<
      SourceRecencyLabel,
      "Unavailable"
    >;
} {
  if (ageDays <= 7) {
    return {
      score: 100,
      label: "Fresh",
    };
  }


  if (ageDays <= 14) {
    return {
      score: 90,
      label: "Recent",
    };
  }


  if (ageDays <= 30) {
    return {
      score: 70,
      label: "Aging",
    };
  }


  if (ageDays <= 60) {
    return {
      score: 40,
      label: "Stale",
    };
  }


  return {
    score: 10,
    label: "Very Stale",
  };
}


function calculateSourceDetail(
  source:
    MarketSourceType,

  observedAt:
    string | null,

  now:
    Date,
): SourceRecencyDetail {
  const ageDays =
    calculateAgeDays(
      observedAt,
      now,
    );


  if (ageDays === null) {
    return {
      source,
      observedAt,
      ageDays:
        null,
      score:
        null,
      label:
        "Unavailable",
    };
  }


  const recency =
    source === "sold"
      ? getSoldRecency(
          ageDays,
        )
      : getReferenceOrActiveRecency(
          ageDays,
        );


  return {
    source,
    observedAt,
    ageDays,
    score:
      recency.score,
    label:
      recency.label,
  };
}


function getOverallLabel(
  score: number,
): Exclude<
  SourceRecencyLabel,
  "Unavailable"
> {
  if (score >= 95) {
    return "Fresh";
  }


  if (score >= 80) {
    return "Recent";
  }


  if (score >= 60) {
    return "Aging";
  }


  if (score >= 30) {
    return "Stale";
  }


  return "Very Stale";
}


export function calculateSourceRecency({
  referenceObservedAt,
  soldObservedAt,
  activeObservedAt,
  now: nowInput,
}: SourceRecencyInput): SourceRecencyResult {
  const now =
    nowInput instanceof Date
      ? nowInput
      : nowInput
        ? new Date(
            nowInput,
          )
        : new Date();


  if (
    !Number.isFinite(
      now.getTime(),
    )
  ) {
    throw new Error(
      "Invalid current timestamp supplied to source recency.",
    );
  }


  const reference =
    calculateSourceDetail(
      "reference",
      referenceObservedAt,
      now,
    );


  const sold =
    calculateSourceDetail(
      "sold",
      soldObservedAt,
      now,
    );


  const active =
    calculateSourceDetail(
      "active",
      activeObservedAt,
      now,
    );


  const available =
    [
      reference,
      sold,
      active,
    ].filter(
      (
        detail,
      ) =>
        detail.score !==
        null,
    );


  const signalsWithTimestamps =
    available.length;


  /*
   * Missing timestamps are unavailable evidence,
   * not stale evidence.
   */
  if (
    available.length === 0
  ) {
    return {
      score:
        null,

      label:
        "Unavailable",

      reference,
      sold,
      active,

      signalsWithTimestamps,

      staleSignals:
        [],

      reasons: [
        "No valid source observation timestamps are available.",
      ],
    };
  }


  /*
   * Relative evidence importance.
   *
   * Verified realized sales receive the highest
   * weight, followed by the canonical reference
   * market and then active asking prices.
   *
   * Weights are normalized across available
   * timestamped sources.
   */
  const sourceWeights: Record<
    MarketSourceType,
    number
  > = {
    reference:
      0.35,

    sold:
      0.40,

    active:
      0.25,
  };


  const totalWeight =
    available.reduce(
      (
        total,
        detail,
      ) =>
        total +
        sourceWeights[
          detail.source
        ],
      0,
    );


  const weightedScore =
    available.reduce(
      (
        total,
        detail,
      ) =>
        total +
        (
          detail.score ??
          0
        ) *
          sourceWeights[
            detail.source
          ],
      0,
    ) /
    totalWeight;


  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          weightedScore,
        ),
      ),
    );


  const label =
    getOverallLabel(
      score,
    );


  const staleSignals =
    available
      .filter(
        (
          detail,
        ) =>
          detail.label ===
            "Stale" ||
          detail.label ===
            "Very Stale",
      )
      .map(
        (
          detail,
        ) =>
          detail.source,
      );


  const reasons: string[] =
    [];


  for (
    const detail of
    [
      reference,
      sold,
      active,
    ]
  ) {
    if (
      detail.ageDays ===
      null
    ) {
      continue;
    }


    reasons.push(
      `${detail.source} market evidence is ${detail.ageDays} day(s) old and classified as ${detail.label}.`,
    );
  }


  if (
    staleSignals.length >
    0
  ) {
    reasons.push(
      `${staleSignals.length} market source(s) contain stale evidence.`,
    );
  }


  return {
    score,
    label,

    reference,
    sold,
    active,

    signalsWithTimestamps,

    staleSignals,

    reasons:
      reasons.slice(
        0,
        5,
      ),
  };
}