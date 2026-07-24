import { calculateDealScore } from "@/lib/analytics/dealScore";

type DealScoreProps = {
  fairMarketValue: number | null;
  listingPrice: number | null;
  recentSalesCount: number;
  activeListingsCount: number;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function DealScore({
  fairMarketValue,
  listingPrice,
  recentSalesCount,
  activeListingsCount,
}: DealScoreProps) {
  if (fairMarketValue === null || listingPrice === null) {
    return (
      <section className="deal-score">
        <div className="deal-score-empty">
          <strong>Deal Score unavailable</strong>

          <p>
            Recent sales and an active listing are required to calculate this
            score.
          </p>
        </div>
      </section>
    );
  }

  const result = calculateDealScore({
    fairMarketValue,
    listingPrice,
    recentSalesCount,
    activeListingsCount,
  });

  if (!result) {
    return null;
  }

  const differenceText =
    result.discountPercent >= 0
      ? `${result.discountPercent.toFixed(1)}% below fair value`
      : `${Math.abs(result.discountPercent).toFixed(1)}% above fair value`;

  return (
    <section className="deal-score">
      <div className="deal-score-heading">
        <div>
          <span className="section-kicker">TCGMVP Analytics</span>

          <h2>Deal Score</h2>

          <p>
            Measures the lowest active listing against recent sold prices,
            market confidence, and liquidity.
          </p>
        </div>

        <div className="deal-score-result">
          <strong>{result.score}</strong>
          <span>/ 100</span>
          <b>{result.label}</b>
        </div>
      </div>

      <div className="deal-score-progress">
        <span style={{ width: `${result.score}%` }} />
      </div>

      <div className="deal-score-summary">
        <div>
          <span>Fair market value</span>
          <strong>{formatCurrency(fairMarketValue)}</strong>
        </div>

        <div>
          <span>Lowest listing</span>
          <strong>{formatCurrency(listingPrice)}</strong>
        </div>

        <div>
          <span>Price position</span>
          <strong>{differenceText}</strong>
        </div>

        <div>
          <span>Confidence</span>
          <strong>{result.confidenceLabel}</strong>
        </div>
      </div>

      <div className="deal-score-breakdown">
        <div>
          <span>Price Advantage</span>
          <strong>{result.priceScore}</strong>
          <small>60% of score</small>
        </div>

        <div>
          <span>Market Confidence</span>
          <strong>{result.confidenceScore}</strong>
          <small>20% of score</small>
        </div>

        <div>
          <span>Liquidity</span>
          <strong>{result.liquidityScore}</strong>
          <small>20% of score</small>
        </div>
      </div>
    </section>
  );
}