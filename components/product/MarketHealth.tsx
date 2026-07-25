import type { MarketHealthResult } from "@/lib/analytics/marketHealth";

type MarketHealthProps = {
  result: MarketHealthResult;
};

function getScoreClass(score: number) {
  if (score >= 85) return "market-health-score--strong";
  if (score >= 70) return "market-health-score--healthy";
  if (score >= 45) return "market-health-score--mixed";

  return "market-health-score--weak";
}

function getStatusClass(score: number) {
  if (score >= 85) return "market-health-status--strong";
  if (score >= 70) return "market-health-status--healthy";
  if (score >= 45) return "market-health-status--mixed";

  return "market-health-status--weak";
}

function getComponentLabel(score: number) {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 45) return "Mixed";

  return "Weak";
}

function getMarketSummary(
  score: number,
  liquidityScore: number,
  supplyBalanceScore: number,
  priceStabilityScore: number,
) {
  if (score >= 85) {
    return "This product shows strong buyer activity, balanced supply, and consistent recent sale prices.";
  }

  if (score >= 70) {
    return "The market appears healthy overall, with solid trading activity and relatively stable pricing.";
  }

  if (score >= 45) {
    if (liquidityScore < 45) {
      return "Pricing appears reasonably stable, but limited recent sales reduce confidence in the market.";
    }

    if (supplyBalanceScore < 45) {
      return "Buyer activity is present, but active supply currently outweighs recent sales.";
    }

    if (priceStabilityScore < 45) {
      return "The product is trading, but recent sale prices show meaningful variation.";
    }

    return "The market shows a mix of positive and weaker signals that should be reviewed together.";
  }

  return "The market currently shows limited activity, weak supply-demand balance, or unstable recent pricing.";
}

export default function MarketHealth({
  result,
}: MarketHealthProps) {
  const scoreClass = getScoreClass(result.score);

  const statusClass = getStatusClass(result.score);

  const marketSummary = getMarketSummary(
    result.score,
    result.liquidityScore,
    result.supplyBalanceScore,
    result.priceStabilityScore,
  );

  return (
    <section className="market-health">
      <div className="market-health-heading">
        <div>
          <span className="section-kicker">TCGMVP Analytics</span>

          <h2>Market Health</h2>

          <p>
            Measures recent trading activity, active supply, and price
            consistency to estimate the overall strength of the market.
          </p>
        </div>

        <div className="market-health-result">
          <span>Market Health Score</span>

          <div className="market-health-score-row">
            <strong className={scoreClass}>{result.score}</strong>
            <small>/100</small>
          </div>

          <div className={`market-health-status ${statusClass}`}>
            {result.label} Market
          </div>
        </div>
      </div>

      <div className="market-health-progress">
        <div
          className={`market-health-progress-fill ${scoreClass}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      <div className="market-health-summary">
        <span>Market Assessment</span>
        <strong>{marketSummary}</strong>
      </div>

      <div className="market-health-grid">
        <div className="market-health-card">
          <div className="market-health-card-heading">
            <div>
              <span>Liquidity</span>
              <strong>{getComponentLabel(result.liquidityScore)}</strong>
            </div>

            <div className="market-health-card-score">
              {result.liquidityScore}
              <small>/100</small>
            </div>
          </div>

          <div className="market-health-card-progress">
            <div
              style={{
                width: `${result.liquidityScore}%`,
              }}
            />
          </div>

          <p>
            Based on {result.salesCount} recent{" "}
            {result.salesCount === 1 ? "sale" : "sales"}.
          </p>
        </div>

        <div className="market-health-card">
          <div className="market-health-card-heading">
            <div>
              <span>Supply Balance</span>
              <strong>
                {getComponentLabel(result.supplyBalanceScore)}
              </strong>
            </div>

            <div className="market-health-card-score">
              {result.supplyBalanceScore}
              <small>/100</small>
            </div>
          </div>

          <div className="market-health-card-progress">
            <div
              style={{
                width: `${result.supplyBalanceScore}%`,
              }}
            />
          </div>

          <p>
            Compares {result.salesCount} recent sales against{" "}
            {result.activeListingsCount} active{" "}
            {result.activeListingsCount === 1
              ? "listing"
              : "listings"}
            .
          </p>
        </div>

        <div className="market-health-card">
          <div className="market-health-card-heading">
            <div>
              <span>Price Stability</span>
              <strong>
                {getComponentLabel(result.priceStabilityScore)}
              </strong>
            </div>

            <div className="market-health-card-score">
              {result.priceStabilityScore}
              <small>/100</small>
            </div>
          </div>

          <div className="market-health-card-progress">
            <div
              style={{
                width: `${result.priceStabilityScore}%`,
              }}
            />
          </div>

          <p>
            {result.priceVariationPercent !== null
              ? `${result.priceVariationPercent.toFixed(
                  1,
                )}% recent price variation.`
              : "More recent sales are needed to measure price variation."}
          </p>
        </div>
      </div>

      <div className="market-health-methodology">
        <span>How this score works</span>

        <p>
          Market Health combines liquidity, supply balance, and price
          stability. Liquidity contributes 40%, while supply balance and
          price stability each contribute 30%.
        </p>
      </div>
    </section>
  );
}