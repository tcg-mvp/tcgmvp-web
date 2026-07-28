import type {
  ConfidenceResult,
} from "@/lib/analytics/confidence";

type MarketConfidenceProps = {
  confidence: ConfidenceResult;
};

const getConfidenceStyles = (
  confidence: ConfidenceResult["confidence"]
) => {
  switch (confidence) {
    case "High":
      return {
        badge:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        bar: "bg-emerald-400",
      };

    case "Medium":
      return {
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-300",
        bar: "bg-amber-400",
      };

    case "Low":
      return {
        badge:
          "border-orange-500/30 bg-orange-500/10 text-orange-300",
        bar: "bg-orange-400",
      };

    default:
      return {
        badge:
          "border-slate-500/30 bg-slate-500/10 text-slate-300",
        bar: "bg-slate-400",
      };
  }
};

export default function MarketConfidence({
  confidence,
}: MarketConfidenceProps) {
  const styles =
    getConfidenceStyles(confidence.confidence);

  const displayScore =
    confidence.confidence === "Insufficient"
      ? 0
      : confidence.score;
  const confidenceDescription = {
    High: "Strong market evidence",
    Medium: "Moderate market evidence",
    Low: "Limited market evidence",
    Insufficient: "Very limited market evidence",
    }[confidence.confidence];
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            Evidence Quality
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Market Confidence
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Measures the strength and completeness of the
            market data supporting these analytics.
          </p>
        </div>

       <div className="flex flex-col items-start gap-2 sm:items-end">
        <div
            className={`inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${styles.badge}`}
        >
            {confidence.confidence}
        </div>

        <p className="text-xs text-slate-500">
            {confidenceDescription}
        </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">
              Confidence Score
            </p>

            <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
              {confidence.confidence ===
              "Insufficient"
                ? "—"
                : confidence.score}
            </p>
          </div>

          <p className="text-sm text-slate-500">
            {confidence.confidence ===
            "Insufficient"
              ? "Not enough evidence"
              : `${confidence.score} / 100`}
          </p>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{
              width: `${displayScore}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-7">
        <h3 className="text-sm font-semibold text-white">
          Confidence Factors
        </h3>

        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {confidence.reasons.map(
            (reason, index) => (
              <li
                key={`${reason}-${index}`}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/10 px-4 py-3 text-sm text-slate-300"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                />

                <span>{reason}</span>
              </li>
            )
          )}
        </ul>
      </div>
    </section>
  );
}