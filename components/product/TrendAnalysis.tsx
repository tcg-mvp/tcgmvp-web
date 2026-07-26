import type {
  TrendAnalysisResult,
  TrendDirection,
} from "@/lib/analytics/trendAnalysis";

type TrendAnalysisProps = {
  analysis: TrendAnalysisResult;
};

function getTrendSymbol(trend: TrendDirection): string {
  switch (trend) {
    case "Very Bullish":
      return "↗";
    case "Bullish":
      return "↑";
    case "Neutral":
      return "→";
    case "Bearish":
      return "↓";
    case "Very Bearish":
      return "↘";
  }
}

function getTrendClassName(trend: TrendDirection): string {
  switch (trend) {
    case "Very Bullish":
    case "Bullish":
      return "trend-positive";

    case "Bearish":
    case "Very Bearish":
      return "trend-negative";

    default:
      return "trend-neutral";
  }
}

export default function TrendAnalysis({
  analysis,
}: TrendAnalysisProps) {
const {
  trend,
  momentum,
  strength,
  confidence,
  salesTracked,
  reasons,
} = analysis;

  const trendClassName = getTrendClassName(trend);

  return (
    <section className="trend-analysis">
      <div className="trend-analysis-header">
        <div>
          <p className="trend-analysis-eyebrow">
            TCGMVP Intelligence
          </p>

          <h2 className="trend-analysis-title">
            Market Trend Analysis
          </h2>

          <p className="trend-analysis-description">
            A structured assessment of recent price movement,
            market position and supporting sales activity.
          </p>
        </div>

        <div
            className={`trend-analysis-status ${trendClassName}`}
            >
            <span className={`trend-analysis-symbol ${trendClassName}`}>
                <span>{getTrendSymbol(trend)}</span>
            </span>

            <div className="trend-analysis-outlook-content">
                <span className="trend-analysis-status-label">
                Market Outlook
                </span>

                <strong>{trend}</strong>

                <span className="trend-analysis-outlook-score">
                Trend Strength: {strength}/100
                </span>
            </div>
            </div>
      </div>

      <div className="trend-analysis-grid">
        <article className="trend-analysis-score-card">
          <div className="trend-analysis-score-header">
            <div>
              <span className="trend-analysis-card-label">
                Trend Strength
              </span>

              <p className="trend-analysis-card-description">
                Overall directional strength based on available
                market data.
              </p>
            </div>

            <strong className="trend-analysis-score">
              {strength}
              <span>/100</span>
            </strong>
          </div>

          <div
            className="trend-analysis-progress"
            role="progressbar"
            aria-label="Trend strength"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={strength}
          >
            <div
              className={`trend-analysis-progress-fill ${trendClassName}`}
              style={{ width: `${strength}%` }}
            />
          </div>
        </article>

        <article className="trend-analysis-detail-card">
          <span className="trend-analysis-card-label">
            Momentum
          </span>

          <strong>{momentum}</strong>

          <p>
            Measures the direction and size of the latest
            30-day price movement.
          </p>
        </article>

        <article className="trend-analysis-detail-card">
        <span className="trend-analysis-card-label">
            Data Confidence
        </span>

        <strong>{confidence}</strong>

        <span className="trend-analysis-evidence">
            {salesTracked} tracked{" "}
            {salesTracked === 1 ? "sale" : "sales"}
        </span>

        <p>
            Confidence reflects the amount of sales and price history
            available to support the analysis.
        </p>
        </article>
      </div>

      <div className="trend-analysis-reasons">
        <h3>What is driving this trend?</h3>

        <ul>
          {reasons.map((reason, index) => (
            <li key={`${reason}-${index}`}>
              <span aria-hidden="true">✓</span>
              <p>{reason}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}