import type {
  RiskAnalysisResult,
  RiskLevel,
} from "@/lib/analytics/riskAnalysis";


type RiskAnalysisProps = {
  analysis: RiskAnalysisResult;
};


function getRiskClassName(
  risk: RiskLevel,
): string {
  switch (risk) {
    case "Very Low":
    case "Low":
      return "risk-low";

    case "Moderate":
      return "risk-moderate";

    case "High":
    case "Very High":
      return "risk-high";
  }
}


function getRiskSymbol(
  risk: RiskLevel,
): string {
  switch (risk) {
    case "Very Low":
      return "✓";

    case "Low":
      return "↓";

    case "Moderate":
      return "–";

    case "High":
      return "↑";

    case "Very High":
      return "!";
  }
}


type RiskMetricProps = {
  label: string;
  value: RiskLevel | null;
  description: string;
};


function RiskMetric({
  label,
  value,
  description,
}: RiskMetricProps) {
  if (value === null) {
    return (
      <article className="risk-analysis-metric-card">
        <span className="risk-analysis-card-label">
          {label}
        </span>

        <strong>
          N/A
        </strong>

        <p>
          {description}
        </p>
      </article>
    );
  }


  const riskClassName =
    getRiskClassName(
      value,
    );


  return (
    <article className="risk-analysis-metric-card">
      <span className="risk-analysis-card-label">
        {label}
      </span>

      <strong className={riskClassName}>
        {value}
      </strong>

      <p>
        {description}
      </p>
    </article>
  );
}


export default function RiskAnalysis({
  analysis,
}: RiskAnalysisProps) {
  const {
    overallRisk,
    riskScore,
    volatilityRisk,
    liquidityRisk,
    valuationRisk,
    dataRisk,
    reasons,
  } = analysis;


  const overallRiskClassName =
    getRiskClassName(
      overallRisk,
    );


  return (
    <section className="risk-analysis">
      <div className="risk-analysis-header">
        <div>
          <p className="risk-analysis-eyebrow">
            TCGMVP Intelligence
          </p>

          <h2 className="risk-analysis-title">
            Market Risk Analysis
          </h2>

          <p className="risk-analysis-description">
            A structured assessment of pricing volatility,
            liquidity, valuation and supporting data quality.
          </p>
        </div>


        <div
          className={`risk-analysis-status ${overallRiskClassName}`}
        >
          <span
            className={`risk-analysis-symbol ${overallRiskClassName}`}
          >
            <span>
              {getRiskSymbol(
                overallRisk,
              )}
            </span>
          </span>

          <div className="risk-analysis-status-content">
            <span className="risk-analysis-status-label">
              Overall Risk
            </span>

            <strong>
              {overallRisk}
            </strong>

            <span className="risk-analysis-status-score">
              Risk Score: {riskScore}/100
            </span>
          </div>
        </div>
      </div>


      <div className="risk-analysis-grid">
        <article className="risk-analysis-score-card">
          <div className="risk-analysis-score-header">
            <div>
              <span className="risk-analysis-card-label">
                Overall Risk Score
              </span>

              <p className="risk-analysis-card-description">
                Higher scores indicate greater market uncertainty
                and potential downside risk.
              </p>
            </div>

            <strong className="risk-analysis-score">
              {riskScore}
              <span>
                /100
              </span>
            </strong>
          </div>

          <div
            className="risk-analysis-progress"
            role="progressbar"
            aria-label="Overall market risk"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={riskScore}
          >
            <div
              className={`risk-analysis-progress-fill ${overallRiskClassName}`}
              style={{
                width:
                  `${riskScore}%`,
              }}
            />
          </div>
        </article>


        <RiskMetric
          label="Volatility Risk"
          value={
            volatilityRisk
          }
          description="Measures recent price movement and the width of the yearly trading range."
        />


        <RiskMetric
          label="Liquidity Risk"
          value={
            liquidityRisk
          }
          description={
            liquidityRisk === null
              ? (
                  "Unavailable because verified recent sales are not yet available."
                )
              : (
                  "Reflects whether enough recent sales exist to support market demand."
                )
          }
        />


        <RiskMetric
          label="Valuation Risk"
          value={
            valuationRisk
          }
          description={
            valuationRisk === null
              ? (
                  "Unavailable because dependable valuation evidence is not yet available."
                )
              : (
                  "Measures how elevated the current price is relative to available valuation evidence."
                )
          }
        />


        <RiskMetric
          label="Data Risk"
          value={
            dataRisk
          }
          description="Reflects the amount and quality of data supporting the assessment."
        />
      </div>


      <div className="risk-analysis-reasons">
        <h3>
          What is driving this risk assessment?
        </h3>

        <ul>
          {reasons.map(
            (
              reason,
              index,
            ) => (
              <li
                key={`${reason}-${index}`}
              >
                <span aria-hidden="true">
                  •
                </span>

                <p>
                  {reason}
                </p>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}