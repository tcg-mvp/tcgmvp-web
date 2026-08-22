import type {
  DealScoreResult,
} from "@/lib/analytics/dealScore";


type DealScoreProps = {
  result: DealScoreResult | null;

  fairMarketValue: number | null;

  listingPrice: number | null;
};


function formatCurrency(
  value: number,
) {
  return value.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  );
}


function getScoreClass(
  score: number,
) {
  if (score >= 85) {
    return "deal-score--excellent";
  }

  if (score >= 70) {
    return "deal-score--good";
  }

  if (score >= 55) {
    return "deal-score--fair";
  }

  if (score >= 40) {
    return "deal-score--weak";
  }

  return "deal-score--poor";
}


function getPricePositionText(
  discountPercent: number,
) {
  if (discountPercent > 0.5) {
    return `${discountPercent.toFixed(
      1,
    )}% below fair value`;
  }

  if (discountPercent < -0.5) {
    return `${Math.abs(
      discountPercent,
    ).toFixed(
      1,
    )}% above fair value`;
  }

  return "Near fair value";
}


function getScoreReasons(
  discountPercent: number,
) {
  const reasons: {
    type:
      | "positive"
      | "neutral"
      | "warning";

    text: string;
  }[] = [];


  if (discountPercent >= 15) {
    reasons.push({
      type:
        "positive",

      text:
        `The current market price is ${discountPercent.toFixed(
          1,
        )}% below estimated fair value, indicating a substantial valuation discount.`,
    });
  } else if (
    discountPercent >= 10
  ) {
    reasons.push({
      type:
        "positive",

      text:
        `The current market price is ${discountPercent.toFixed(
          1,
        )}% below estimated fair value.`,
    });
  } else if (
    discountPercent >= 5
  ) {
    reasons.push({
      type:
        "positive",

      text:
        "The current market price provides a modest discount to estimated fair value.",
    });
  } else if (
    discountPercent > 0.5
  ) {
    reasons.push({
      type:
        "neutral",

      text:
        "The current market price is slightly below estimated fair value.",
    });
  } else if (
    discountPercent < -10
  ) {
    reasons.push({
      type:
        "warning",

      text:
        `The current market price is ${Math.abs(
          discountPercent,
        ).toFixed(
          1,
        )}% above estimated fair value, indicating a meaningful valuation premium.`,
    });
  } else if (
    discountPercent < -3
  ) {
    reasons.push({
      type:
        "warning",

      text:
        "The current market price is moderately above estimated fair value.",
    });
  } else if (
    discountPercent < -0.5
  ) {
    reasons.push({
      type:
        "neutral",

      text:
        "The current market price is slightly above estimated fair value.",
    });
  } else {
    reasons.push({
      type:
        "neutral",

      text:
        "The current market price is trading close to estimated fair value.",
    });
  }


  /*
   * Deal Score is intentionally valuation-only.
   *
   * Confidence and liquidity are presented
   * elsewhere in TCGMVP.
   */
  reasons.push({
    type:
      "neutral",

    text:
      "Deal Score measures valuation only. Market liquidity and evidence quality are evaluated separately.",
  });


  return reasons;
}


export default function DealScore({
  result,
  fairMarketValue,
  listingPrice,
}: DealScoreProps) {
  if (
    !result ||
    fairMarketValue === null ||
    listingPrice === null
  ) {
    return (
      <section className="deal-score">
        <div className="deal-score-empty">
          <strong>
            Deal Score unavailable
          </strong>

          <p>
            A valid current market price and
            Fair Value estimate are required to
            calculate the Deal Score.
          </p>
        </div>
      </section>
    );
  }


  const scoreClass =
    getScoreClass(
      result.score,
    );


  const differenceText =
    getPricePositionText(
      result.discountPercent,
    );


  const scoreReasons =
    getScoreReasons(
      result.discountPercent,
    );


  return (
    <section
      className={`deal-score ${scoreClass}`}
    >
      <div className="deal-score-heading">
        <div className="deal-score-introduction">
          <span className="section-kicker">
            TCGMVP Analytics
          </span>

          <h2>
            Deal Score
          </h2>

          <p>
            Measures how attractive the current
            market price is relative to TCGMVP
            estimated Fair Value.
          </p>
        </div>


        <div className="deal-score-result">
          <div className="deal-score-number">
            <strong>
              {result.score}
            </strong>

            <span>
              / 100
            </span>
          </div>

          <b>
            {result.label}
          </b>

          <small>
            Valuation opportunity
          </small>
        </div>
      </div>


      <div
        className="deal-score-progress"
        role="progressbar"
        aria-label="Deal Score"
        aria-valuenow={
          result.score
        }
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span
          style={{
            width:
              `${result.score}%`,
          }}
        />
      </div>


      <div className="deal-score-summary">
        <div>
          <span>
            Fair Value
          </span>

          <strong>
            {formatCurrency(
              fairMarketValue,
            )}
          </strong>
        </div>


        <div>
          <span>
            Current Market Price
          </span>

          <strong>
            {formatCurrency(
              listingPrice,
            )}
          </strong>
        </div>


        <div>
          <span>
            Price Position
          </span>

          <strong>
            {differenceText}
          </strong>
        </div>


        <div>
          <span>
            Valuation Score
          </span>

          <strong>
            {result.priceScore}/100
          </strong>
        </div>
      </div>


      <div className="deal-score-explanation">
        <div className="deal-score-section-heading">
          <span>
            Score Analysis
          </span>

          <h3>
            Why this score?
          </h3>
        </div>


        <div className="deal-score-reasons">
          {scoreReasons.map(
            (reason) => (
              <div
                key={
                  reason.text
                }
                className={`deal-score-reason deal-score-reason--${reason.type}`}
              >
                <span
                  aria-hidden="true"
                />

                <p>
                  {reason.text}
                </p>
              </div>
            ),
          )}
        </div>
      </div>


      <div className="deal-score-breakdown-section">
        <div className="deal-score-section-heading">
          <span>
            Calculation
          </span>

          <h3>
            Score Breakdown
          </h3>
        </div>


        <div className="deal-score-breakdown">
          <div className="deal-score-breakdown-card">
            <div className="deal-score-breakdown-header">
              <span>
                Valuation
              </span>

              <strong>
                {result.priceScore}
                <small>
                  {" "}
                  / 100
                </small>
              </strong>
            </div>


            <div className="deal-score-breakdown-progress">
              <span
                style={{
                  width:
                    `${result.priceScore}%`,
                }}
              />
            </div>


            <small>
              100% of Deal Score · current
              market price versus Fair Value
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}