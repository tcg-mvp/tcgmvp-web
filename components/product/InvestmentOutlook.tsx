import type {
  InvestmentOutlookDirection,
  InvestmentOutlookResult,
} from "@/lib/analytics/investmentOutlook";

type InvestmentOutlookProps = {
  outlook: InvestmentOutlookResult;
};

function getOutlookClass(
  outlook: InvestmentOutlookDirection,
) {
  switch (outlook) {
    case "Very Bullish":
    case "Bullish":
      return "positive";

    case "Neutral":
      return "neutral";

    case "Bearish":
    case "Very Bearish":
      return "negative";

    default:
      return "unrated";
  }
}

function getScoreClass(score: number) {
  if (score >= 65) {
    return "positive";
  }

  if (score < 45) {
    return "negative";
  }

  return "neutral";
}

export default function InvestmentOutlook({
  outlook,
}: InvestmentOutlookProps) {
  const hasOutlook =
    outlook.overallOutlook !== "Unknown";

  const outlookClass = getOutlookClass(
    outlook.overallOutlook,
  );

  return (
    <section className="investment-outlook-card">
      <div className="investment-outlook-header">
        <div>
          <span className="investment-outlook-kicker">
            TCGMVP Investment Outlook
          </span>

          <h3>Forward Investment Analysis</h3>

          <p>
            A strategic outlook combining market direction,
            investment quality, expected return, supply,
            collector demand, and risk.
          </p>
        </div>

        <div
          className={`investment-outlook-verdict ${outlookClass}`}
        >
          <span>Overall Outlook</span>

          <strong>
            {outlook.overallOutlook}
          </strong>

          {hasOutlook && (
            <small>
              {outlook.overallScore}/100
            </small>
          )}
        </div>
      </div>

      {hasOutlook ? (
        <>
          <div className="investment-outlook-summary">
            <span className="investment-outlook-section-label">
              Investment Thesis
            </span>

            <p>{outlook.summary}</p>

            <div className="investment-outlook-confidence">
              <span>Confidence</span>

              <strong>
                {outlook.confidence}
              </strong>

              <small>
                {outlook.confidenceScore}/100
              </small>
            </div>
          </div>

          <div className="investment-outlook-primary-grid">
            <div className="investment-outlook-primary-card">
              <span>Short-Term Outlook</span>

              <strong
                className={getOutlookClass(
                  outlook.shortTermOutlook,
                )}
              >
                {outlook.shortTermOutlook}
              </strong>

              <small>
                {outlook.shortTermScore}/100
              </small>
            </div>

            <div className="investment-outlook-primary-card">
              <span>Long-Term Outlook</span>

              <strong
                className={getOutlookClass(
                  outlook.longTermOutlook,
                )}
              >
                {outlook.longTermOutlook}
              </strong>

              <small>
                {outlook.longTermScore}/100
              </small>
            </div>
          </div>

          <div className="investment-outlook-metrics">
            <div>
              <span>Collector Demand</span>

              <strong>
                {outlook.collectorDemand}
              </strong>

              <small>
                {outlook.collectorDemandScore}/100
              </small>
            </div>

            <div>
              <span>Supply Outlook</span>

              <strong>
                {outlook.supplyOutlook}
              </strong>

              <small>
                {outlook.supplyScore}/100
              </small>
            </div>

            <div>
              <span>Market Maturity</span>

              <strong>
                {outlook.marketMaturity}
              </strong>

              <small>
                {outlook.maturityScore}/100
              </small>
            </div>
          </div>

          <div className="investment-outlook-score-bars">
            <div>
              <div className="investment-outlook-bar-heading">
                <span>Short-Term Strength</span>
                <strong>
                  {outlook.shortTermScore}
                </strong>
              </div>

              <div className="investment-outlook-bar-track">
                <span
                  className={getScoreClass(
                    outlook.shortTermScore,
                  )}
                  style={{
                    width: `${outlook.shortTermScore}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="investment-outlook-bar-heading">
                <span>Long-Term Strength</span>
                <strong>
                  {outlook.longTermScore}
                </strong>
              </div>

              <div className="investment-outlook-bar-track">
                <span
                  className={getScoreClass(
                    outlook.longTermScore,
                  )}
                  style={{
                    width: `${outlook.longTermScore}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="investment-outlook-bar-heading">
                <span>Collector Demand</span>
                <strong>
                  {outlook.collectorDemandScore}
                </strong>
              </div>

              <div className="investment-outlook-bar-track">
                <span
                  className={getScoreClass(
                    outlook.collectorDemandScore,
                  )}
                  style={{
                    width: `${outlook.collectorDemandScore}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="investment-outlook-bar-heading">
                <span>Supply Constraint</span>
                <strong>
                  {outlook.supplyScore}
                </strong>
              </div>

              <div className="investment-outlook-bar-track">
                <span
                  className={getScoreClass(
                    outlook.supplyScore,
                  )}
                  style={{
                    width: `${outlook.supplyScore}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="investment-outlook-evidence">
            <div className="investment-outlook-evidence-column">
              <span className="investment-outlook-list-title">
                Investment Strengths
              </span>

              {outlook.strengths.length > 0 ? (
                <ul>
                  {outlook.strengths.map(
                    (strength) => (
                      <li key={strength}>
                        <span
                          className="investment-outlook-list-icon positive"
                          aria-hidden="true"
                        >
                          ✓
                        </span>

                        {strength}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>
                  No major investment strengths were
                  identified from the available data.
                </p>
              )}
            </div>

            <div className="investment-outlook-evidence-column">
              <span className="investment-outlook-list-title">
                Market Headwinds
              </span>

              {outlook.headwinds.length > 0 ? (
                <ul>
                  {outlook.headwinds.map(
                    (headwind) => (
                      <li key={headwind}>
                        <span
                          className="investment-outlook-list-icon negative"
                          aria-hidden="true"
                        >
                          !
                        </span>

                        {headwind}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>
                  No material market headwinds were
                  identified from the available data.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="investment-outlook-empty">
          <span className="investment-outlook-kicker">
            Insufficient Market Evidence
          </span>

          <h4>Investment outlook unavailable</h4>

          <p>{outlook.summary}</p>

          <div className="investment-outlook-confidence-empty">
            Confidence: {outlook.confidence} ·{" "}
            {outlook.confidenceScore}/100
          </div>
        </div>
      )}
    </section>
  );
}