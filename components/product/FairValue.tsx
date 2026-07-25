type FairValueProps = {
  fairValue: number | null;
  medianSale: number | null;
  averageSale: number | null;
  lowestSale: number | null;
  highestSale: number | null;
  salesCount: number;
  listingPrice: number | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getConfidenceLabel(salesCount: number) {
  if (salesCount >= 10) return "High";
  if (salesCount >= 5) return "Medium";
  return "Low";
}

function getConfidenceClass(salesCount: number) {
  if (salesCount >= 10) return "fair-value-confidence--high";
  if (salesCount >= 5) return "fair-value-confidence--medium";
  return "fair-value-confidence--low";
}

function getPricePosition(
  fairValue: number,
  listingPrice: number | null,
) {
  if (listingPrice === null) {
    return {
      label: "No active listing",
      className: "fair-value-position--neutral",
    };
  }

  const differencePercent =
    ((fairValue - listingPrice) / fairValue) * 100;

  if (differencePercent >= 5) {
    return {
      label: `${differencePercent.toFixed(1)}% below fair value`,
      className: "fair-value-position--positive",
    };
  }

  if (differencePercent > 0.5) {
    return {
      label: `${differencePercent.toFixed(1)}% below fair value`,
      className: "fair-value-position--neutral",
    };
  }

  if (differencePercent < -0.5) {
    return {
      label: `${Math.abs(differencePercent).toFixed(
        1,
      )}% above fair value`,
      className: "fair-value-position--warning",
    };
  }

  return {
    label: "Near fair value",
    className: "fair-value-position--neutral",
  };
}

export default function FairValue({
  fairValue,
  medianSale,
  averageSale,
  lowestSale,
  highestSale,
  salesCount,
  listingPrice,
}: FairValueProps) {
  if (fairValue === null) {
    return (
      <section className="fair-value">
        <div className="fair-value-empty">
          <strong>Fair Value unavailable</strong>

          <p>
            Recent sold prices are required to estimate fair market value.
          </p>
        </div>
      </section>
    );
  }

  const confidenceLabel = getConfidenceLabel(salesCount);

  const confidenceClass = getConfidenceClass(salesCount);

  const pricePosition = getPricePosition(
    fairValue,
    listingPrice,
  );

  return (
    <section className="fair-value">
      <div className="fair-value-heading">
        <div>
          <span className="section-kicker">TCGMVP Valuation</span>

          <h2>Fair Value</h2>

          <p>
            Estimated using the median of recent verified sold prices to
            reduce the impact of unusually high or low sales.
          </p>
        </div>

        <div className="fair-value-result">
          <span>Estimated Fair Value</span>

          <strong>{formatCurrency(fairValue)}</strong>

          <div
            className={`fair-value-confidence ${confidenceClass}`}
          >
            {confidenceLabel} Confidence
          </div>

          <small>
            Based on {salesCount} recent{" "}
            {salesCount === 1 ? "sale" : "sales"}
          </small>
        </div>
      </div>

      <div className="fair-value-summary">
        <div>
          <span>Median Sale</span>
          <strong>
            {medianSale !== null
              ? formatCurrency(medianSale)
              : "Unavailable"}
          </strong>
        </div>

        <div>
          <span>Average Sale</span>
          <strong>
            {averageSale !== null
              ? formatCurrency(averageSale)
              : "Unavailable"}
          </strong>
        </div>

        <div>
          <span>Recent Sale Range</span>
          <strong>
            {lowestSale !== null &&
            highestSale !== null
              ? `${formatCurrency(
                  lowestSale,
                )} – ${formatCurrency(highestSale)}`
              : "Unavailable"}
          </strong>
        </div>

        <div>
          <span>Lowest Listing</span>
          <strong>
            {listingPrice !== null
              ? formatCurrency(listingPrice)
              : "Unavailable"}
          </strong>
        </div>
      </div>

      <div className="fair-value-position">
        <div>
          <span>Current Price Position</span>

          <strong className={pricePosition.className}>
            {pricePosition.label}
          </strong>
        </div>

        <p>
          Fair Value is an estimate based on recent sold prices and should
          be considered alongside condition, seller quality, fees, and
          market trends.
        </p>
      </div>
    </section>
  );
}