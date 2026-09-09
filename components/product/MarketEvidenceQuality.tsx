import {
  calculateCrossSourceAgreement,
} from "@/lib/analytics/crossSourceAgreement";

import {
  calculateSourceRecency,
} from "@/lib/analytics/sourceRecency";

import {
  calculateSourceEvidenceQuality,
} from "@/lib/analytics/sourceEvidenceQuality";

import {
  calculateMarketAnomalyDetection,
} from "@/lib/analytics/marketAnomalyDetection";


type CrossSourceAgreementResult =
  ReturnType<
    typeof calculateCrossSourceAgreement
  >;


type SourceRecencyResult =
  ReturnType<
    typeof calculateSourceRecency
  >;


type SourceEvidenceQualityResult =
  ReturnType<
    typeof calculateSourceEvidenceQuality
  >;


type MarketAnomalyDetectionResult =
  ReturnType<
    typeof calculateMarketAnomalyDetection
  >;


type MarketEvidenceQualityProps = {
  crossSourceAgreement:
    CrossSourceAgreementResult;

  sourceRecency:
    SourceRecencyResult;

  evidenceQuality:
    SourceEvidenceQualityResult;

  anomalyDetection:
    MarketAnomalyDetectionResult;

  verifiedSalesCount:
    number;

  activeListingsCount:
    number;

  historyPoints:
    number;
};


type Tone =
  | "positive"
  | "good"
  | "warning"
  | "negative"
  | "neutral";


function evidenceTone(
  label:
    SourceEvidenceQualityResult["label"],
): Tone {
  switch (label) {
    case "Excellent":
      return "positive";

    case "Strong":
      return "good";

    case "Moderate":
      return "warning";

    case "Thin":
    case "Insufficient":
      return "negative";
  }
}


function agreementTone(
  label:
    CrossSourceAgreementResult["agreement"],
): Tone {
  switch (label) {
    case "Strong":
      return "positive";

    case "Moderate":
      return "good";

    case "Weak":
      return "warning";

    case "Divergent":
      return "negative";

    case "Unavailable":
      return "neutral";
  }
}


function recencyTone(
  label:
    SourceRecencyResult["label"],
): Tone {
  switch (label) {
    case "Fresh":
      return "positive";

    case "Recent":
      return "good";

    case "Aging":
      return "warning";

    case "Stale":
    case "Very Stale":
      return "negative";

    case "Unavailable":
      return "neutral";
  }
}


function anomalyTone(
  level:
    MarketAnomalyDetectionResult["level"],
): Tone {
  switch (level) {
    case "None":
      return "positive";

    case "Low":
      return "good";

    case "Moderate":
      return "warning";

    case "High":
      return "negative";
  }
}


function scoreDisplay(
  score:
    number | null,
) {
  return score === null
    ? "—"
    : score;
}


function scoreWidth(
  score:
    number | null,
) {
  return `${Math.max(
    0,
    Math.min(
      100,
      score ?? 0,
    ),
  )}%`;
}


export default function MarketEvidenceQuality({
  crossSourceAgreement,
  sourceRecency,
  evidenceQuality,
  anomalyDetection,
  verifiedSalesCount,
  activeListingsCount,
  historyPoints,
}: MarketEvidenceQualityProps) {
  const evidenceQualityTone =
    evidenceTone(
      evidenceQuality.label,
    );


  const sourceAgreementTone =
    agreementTone(
      crossSourceAgreement
        .agreement,
    );


  const freshnessTone =
    recencyTone(
      sourceRecency.label,
    );


  const marketAnomalyTone =
    anomalyTone(
      anomalyDetection.level,
    );


  const realizedSalesMessage =
    crossSourceAgreement
      .realizedSalesDiagnosis !==
      "Unavailable"
      ? crossSourceAgreement
          .realizedSalesReason
      : null;


  const showAnomalyWarning =
    anomalyDetection.level ===
      "Moderate" ||
    anomalyDetection.level ===
      "High";


  return (
    <section className="market-evidence-quality">
      <div className="market-evidence-quality-header">
        <div>
          <span className="market-evidence-quality-kicker">
            Data Integrity
          </span>

          <h3>
            Evidence & Trust
          </h3>

          <p>
            Evaluates the depth, freshness,
            consistency, and statistical quality
            of the market evidence supporting
            this report.
          </p>
        </div>


        <div
          className={`market-evidence-quality-overall market-evidence-tone-${evidenceQualityTone}`}
        >
          <span>
            Evidence Quality
          </span>

          <strong>
            {evidenceQuality.label}
          </strong>

          <small>
            {evidenceQuality.score}
            /100
          </small>
        </div>
      </div>


      <div className="market-evidence-quality-grid">
        <div
          className={`market-evidence-quality-card market-evidence-tone-${evidenceQualityTone}`}
        >
          <div className="market-evidence-quality-card-heading">
            <div>
              <span>
                Evidence Quality
              </span>

              <strong>
                {scoreDisplay(
                  evidenceQuality.score,
                )}
              </strong>
            </div>

            <b>
              {evidenceQuality.label}
            </b>
          </div>

          <div className="market-evidence-quality-track">
            <span
              style={{
                width:
                  scoreWidth(
                    evidenceQuality.score,
                  ),
              }}
            />
          </div>

          <small>
            Depth of the observable
            market dataset.
          </small>
        </div>


        <div
          className={`market-evidence-quality-card market-evidence-tone-${sourceAgreementTone}`}
        >
          <div className="market-evidence-quality-card-heading">
            <div>
              <span>
                Source Agreement
              </span>

              <strong>
                {scoreDisplay(
                  crossSourceAgreement
                    .score,
                )}
              </strong>
            </div>

            <b>
              {
                crossSourceAgreement
                  .agreement
              }
            </b>
          </div>

          <div className="market-evidence-quality-track">
            <span
              style={{
                width:
                  scoreWidth(
                    crossSourceAgreement
                      .score,
                  ),
              }}
            />
          </div>

          <small>
            Consistency across independent
            market-price signals.
          </small>
        </div>


        <div
          className={`market-evidence-quality-card market-evidence-tone-${freshnessTone}`}
        >
          <div className="market-evidence-quality-card-heading">
            <div>
              <span>
                Data Freshness
              </span>

              <strong>
                {scoreDisplay(
                  sourceRecency.score,
                )}
              </strong>
            </div>

            <b>
              {sourceRecency.label}
            </b>
          </div>

          <div className="market-evidence-quality-track">
            <span
              style={{
                width:
                  scoreWidth(
                    sourceRecency.score,
                  ),
              }}
            />
          </div>

          <small>
            Recency of reference, sold,
            and active-market evidence.
          </small>
        </div>


        <div
          className={`market-evidence-quality-card market-evidence-tone-${marketAnomalyTone}`}
        >
          <div className="market-evidence-quality-card-heading">
            <div>
                <span>
                Anomaly Severity
                </span>
              <strong>
                {
                  anomalyDetection
                    .anomalyScore
                }
              </strong>
            </div>

            <b>
              {
                anomalyDetection
                  .level
              }
            </b>
          </div>

          <div className="market-evidence-quality-track market-evidence-quality-track-anomaly">
            <span
              style={{
                width:
                  scoreWidth(
                    anomalyDetection
                      .anomalyScore,
                  ),
              }}
            />
          </div>

            <small>
            Lower is better · statistical
            irregularity in market evidence.
            </small>
        </div>
      </div>


      <div className="market-evidence-quality-base">
        <div>
          <span>
            Evidence Base
          </span>

          <p>
            <strong>
              {verifiedSalesCount}
            </strong>{" "}
            verified sale
            {verifiedSalesCount === 1
              ? ""
              : "s"}

            <i>·</i>

            <strong>
              {activeListingsCount}
            </strong>{" "}
            active listing
            {activeListingsCount === 1
              ? ""
              : "s"}

            <i>·</i>

            <strong>
              {historyPoints.toLocaleString(
                "en-US",
              )}
            </strong>{" "}
            historical observation
            {historyPoints === 1
              ? ""
              : "s"}
          </p>
        </div>


        {realizedSalesMessage && (
          <div className="market-evidence-quality-confirmation">
            <span>
              Realized-Market Confirmation
            </span>

            <p>
              {
                realizedSalesMessage
              }
            </p>
          </div>
        )}
      </div>


      {showAnomalyWarning && (
        <div className="market-evidence-quality-warning">
          <strong>
            Market anomaly detected
          </strong>

          <p>
            {
              anomalyDetection
                .reasons[0] ??
              "Current market observations contain unusual pricing behavior that may reduce comparability."
            }
          </p>
        </div>
      )}
    </section>
  );
}