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

function getScoreClass(score: number) {
  if (score >= 85) return "deal-score--excellent";
  if (score >= 70) return "deal-score--good";
  if (score >= 55) return "deal-score--fair";
  if (score >= 40) return "deal-score--weak";

  return "deal-score--poor";
}

function getConfidenceClass(confidenceLabel: string) {
  const normalizedLabel = confidenceLabel.toLowerCase();

  if (normalizedLabel.includes("high")) {
    return "confidence-badge--high";
  }

  if (normalizedLabel.includes("medium")) {
    return "confidence-badge--medium";
  }

  return "confidence-badge--low";
}

function getPricePositionText(discountPercent: number) {
  if (discountPercent > 0.5) {
    return `${discountPercent.toFixed(1)}% below fair value`;
  }

  if (discountPercent < -0.5) {
    return `${Math.abs(discountPercent).toFixed(1)}% above fair value`;
  }

  return "Near fair value";
}

function getScoreReasons({
  discountPercent,
  recentSalesCount,
  activeListingsCount,
}: {
  discountPercent: number;
  recentSalesCount: number;
  activeListingsCount: number;
}) {
  const reasons: {
    type: "positive" | "neutral" | "warning";
    text: string;
  }[] = [];

  if (discountPercent >= 5) {
    reasons.push({
      type: "positive",
      text: `The lowest listing is ${discountPercent.toFixed(
        1,
      )}% below fair value.`,
    });
  } else if (discountPercent > 0.5) {
    reasons.push({
      type: "neutral",
      text: `The lowest listing is slightly below fair value.`,
    });
  } else if (discountPercent < -0.5) {
    reasons.push({
      type: "warning",
      text: `The lowest listing is ${Math.abs(discountPercent).toFixed(
        1,
      )}% above fair value.`,
    });
  } else {
    reasons.push({
      type: "neutral",
      text: "The lowest listing is currently near fair value.",
    });
  }

  if (recentSalesCount >= 10) {
    reasons.push({
      type: "positive",
      text: `${recentSalesCount} recent sales provide strong pricing confidence.`,
    });
  } else if (recentSalesCount >= 5) {
    reasons.push({
      type: "neutral",
      text: `${recentSalesCount} recent sales provide moderate pricing confidence.`,
    });
  } else {
    reasons.push({
      type: "warning",
      text: `Only ${recentSalesCount} recent sales are available, reducing confidence.`,
    });
  }

  if (activeListingsCount >= 8) {
    reasons.push({
      type: "positive",
      text: `${activeListingsCount} active listings indicate healthy market availability.`,
    });
  } else if (activeListingsCount >= 3) {
    reasons.push({
      type: "neutral",
      text: `${activeListingsCount} active listings indicate moderate market availability.`,
    });
  } else {
    reasons.push({
      type: "warning",
      text: `Only ${activeListingsCount} active listings are available.`,
    });
  }

  return reasons;
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

  const scoreClass = getScoreClass(result.score);

  const confidenceClass = getConfidenceClass(result.confidenceLabel);

  const differenceText = getPricePositionText(result.discountPercent);

  const scoreReasons = getScoreReasons({
    discountPercent: result.discountPercent,
    recentSalesCount,
    activeListingsCount,
  });

  const breakdownItems = [
    {
      label: "Price Advantage",
      rawScore: result.priceScore,
      weight: 60,
    },
    {
      label: "Market Confidence",
      rawScore: result.confidenceScore,
      weight: 20,
    },
    {
      label: "Liquidity",
      rawScore: result.liquidityScore,
      weight: 20,
    },
  ];

  return (
    <section className={`deal-score ${scoreClass}`}>
      <div className="deal-score-heading">
        <div className="deal-score-introduction">
          <span className="section-kicker">TCGMVP Analytics</span>

          <h2>Deal Score</h2>

          <p>
            Measures the lowest active listing against recent sold prices,
            market confidence, and liquidity.
          </p>
        </div>

        <div className="deal-score-result">
          <div className="deal-score-number">
            <strong>{result.score}</strong>
            <span>/ 100</span>
          </div>

          <b>{result.label}</b>

          <div className={`confidence-badge ${confidenceClass}`}>
            {result.confidenceLabel} Confidence
          </div>

          <small>
            Based on {recentSalesCount} recent{" "}
            {recentSalesCount === 1 ? "sale" : "sales"}
          </small>
        </div>
      </div>

      <div
        className="deal-score-progress"
        role="progressbar"
        aria-label="Deal Score"
        aria-valuenow={result.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${result.score}%` }} />
      </div>

      <div className="deal-score-summary">
        <div>
          <span>Fair Market Value</span>
          <strong>{formatCurrency(fairMarketValue)}</strong>
        </div>

        <div>
          <span>Lowest Listing</span>
          <strong>{formatCurrency(listingPrice)}</strong>
        </div>

        <div>
          <span>Price Position</span>
          <strong>{differenceText}</strong>
        </div>

        <div>
          <span>Market Data</span>
          <strong>
            {recentSalesCount} sales · {activeListingsCount} listings
          </strong>
        </div>
      </div>

      <div className="deal-score-explanation">
        <div className="deal-score-section-heading">
          <span>Score Analysis</span>
          <h3>Why this score?</h3>
        </div>

        <div className="deal-score-reasons">
          {scoreReasons.map((reason) => (
            <div
              className={`deal-score-reason deal-score-reason--${reason.type}`}
              key={reason.text}
            >
              <span aria-hidden="true" />
              <p>{reason.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="deal-score-breakdown-section">
        <div className="deal-score-section-heading">
          <span>Calculation</span>
          <h3>Score Breakdown</h3>
        </div>

        <div className="deal-score-breakdown">
          {breakdownItems.map((item) => {
            const weightedPoints = (item.rawScore * item.weight) / 100;

            return (
              <div className="deal-score-breakdown-card" key={item.label}>
                <div className="deal-score-breakdown-header">
                  <span>{item.label}</span>

                  <strong>
                    {weightedPoints.toFixed(1)}
                    <small> / {item.weight}</small>
                  </strong>
                </div>

                <div className="deal-score-breakdown-progress">
                  <span style={{ width: `${item.rawScore}%` }} />
                </div>

                <small>
                  {item.rawScore}/100 component score · {item.weight}% weighting
                </small>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}