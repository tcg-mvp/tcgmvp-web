import type {
  PriceTargetResult,
} from "@/lib/analytics/priceTarget";

type PriceTargetProps = {
  priceTarget: PriceTargetResult;
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toFixed(1)}%`;
}

function formatAbsolutePercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return `${Math.abs(value).toFixed(1)}%`;
}

function getVerdictClass(
  verdict: PriceTargetResult["verdict"],
) {
  switch (verdict) {
    case "Exceptional":
    case "Strong":
      return "positive";

    case "Good":
    case "Fair":
      return "neutral";

    case "Limited":
    case "Overpriced":
      return "negative";

    default:
      return "unrated";
  }
}

function getSignedValueClass(value: number | null) {
  if (value === null || value === 0) {
    return "";
  }

  return value > 0 ? "positive" : "negative";
}

export default function PriceTarget({
  priceTarget,
}: PriceTargetProps) {
  const verdictClass = getVerdictClass(
    priceTarget.verdict,
  );

  const hasTarget =
    priceTarget.targetPrice !== null;

  return (
    <section className="price-target-card">
      <div className="price-target-header">
        <div>
          <span className="price-target-kicker">
            TCGMVP Price Target
          </span>

          <h3>Estimated Market Potential</h3>

          <p>
            A forward-looking valuation based on fair value,
            market direction, risk, market health, and
            investment quality.
          </p>
        </div>

        <div
          className={`price-target-verdict ${verdictClass}`}
        >
          <span>Opportunity</span>
          <strong>{priceTarget.verdict}</strong>
        </div>
      </div>

      {hasTarget ? (
        <>
          <div className="price-target-hero">
            <div className="price-target-main-value">
              <span>Price Target</span>

              <strong>
                {formatCurrency(
                  priceTarget.targetPrice,
                )}
              </strong>

              <small>
                {priceTarget.confidence} confidence ·{" "}
                {priceTarget.confidenceScore}/100
              </small>
            </div>

            <div className="price-target-upside">
              <span>Expected Return</span>

              <strong
                className={getSignedValueClass(
                  priceTarget.potentialUpsidePercent,
                )}
              >
                {formatPercent(
                  priceTarget.potentialUpsidePercent,
                )}
              </strong>

              <small>
                From the current market price
              </small>
            </div>
          </div>

          <div className="price-target-metrics">
            <div>
              <span>Current Price</span>

              <strong>
                {formatCurrency(
                  priceTarget.currentPrice,
                )}
              </strong>
            </div>

            <div>
              <span>Fair Value</span>

              <strong>
                {formatCurrency(
                  priceTarget.fairValue,
                )}
              </strong>
            </div>

            <div>
              <span>Margin of Safety</span>

              <strong
                className={getSignedValueClass(
                  priceTarget.marginOfSafetyPercent,
                )}
              >
                {formatPercent(
                  priceTarget.marginOfSafetyPercent,
                )}
              </strong>
            </div>

            <div>
              <span>Downside Risk</span>

              <strong
                className={
                  (priceTarget.downsideRiskPercent ?? 0) > 0
                    ? "negative"
                    : ""
                }
              >
                {formatAbsolutePercent(
                  priceTarget.downsideRiskPercent,
                )}
              </strong>
            </div>

            <div>
              <span>Market Adjustment</span>

              <strong
                className={getSignedValueClass(
                  priceTarget.targetAdjustmentPercent,
                )}
              >
                {formatPercent(
                  priceTarget.targetAdjustmentPercent,
                )}
              </strong>
            </div>

            <div>
              <span>Valuation Adjustment</span>

              <strong
                className={getSignedValueClass(
                  priceTarget.valuationAdjustmentPercent,
                )}
              >
                {formatPercent(
                  priceTarget.valuationAdjustmentPercent,
                )}
              </strong>
            </div>
          </div>

          <div className="price-target-evidence">
            <div className="price-target-evidence-column">
              <span className="price-target-list-title">
                Supporting Drivers
              </span>

              {priceTarget.drivers.length > 0 ? (
                <ul>
                  {priceTarget.drivers.map(
                    (driver) => (
                      <li key={driver}>
                        <span
                          className="price-target-list-icon positive"
                          aria-hidden="true"
                        >
                          ✓
                        </span>

                        {driver}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>
                  No major positive pricing drivers were
                  identified.
                </p>
              )}
            </div>

            <div className="price-target-evidence-column">
              <span className="price-target-list-title">
                Risks and Limitations
              </span>

              {priceTarget.concerns.length > 0 ? (
                <ul>
                  {priceTarget.concerns.map(
                    (concern) => (
                      <li key={concern}>
                        <span
                          className="price-target-list-icon negative"
                          aria-hidden="true"
                        >
                          !
                        </span>

                        {concern}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p>
                  No material valuation concerns were
                  identified from the available data.
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="price-target-empty">
          <span className="price-target-kicker">
            Insufficient Market Evidence
          </span>

          <h4>Price target unavailable</h4>

          <p>
            TCGMVP requires a valid current price and fair
            value before producing a forward-looking target.
          </p>

          <div className="price-target-confidence-empty">
            Confidence: {priceTarget.confidence} ·{" "}
            {priceTarget.confidenceScore}/100
          </div>
        </div>
      )}
    </section>
  );
}