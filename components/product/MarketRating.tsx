import type {
  MarketRatingResult,
} from "@/lib/analytics/marketRating";


type MarketRatingProps = {
  rating: MarketRatingResult;
};


function getRatingClass(
  label: MarketRatingResult["rating"],
) {
  switch (label) {
    case "Exceptional":
    case "Strong":
      return "market-rating-positive";

    case "Favorable":
      return "market-rating-favorable";

    case "Neutral":
      return "market-rating-neutral";

    case "Weak":
    case "Very Weak":
      return "market-rating-negative";

    default:
      return "market-rating-neutral";
  }
}


function getRatingInterpretation(
  label: MarketRatingResult["rating"],
) {
  switch (label) {
    case "Exceptional":
      return "An exceptional market profile supported by strong momentum, healthy structure, favorable valuation, and limited risk.";

    case "Strong":
      return "A strong market profile with favorable conditions across most major analytical dimensions.";

    case "Favorable":
      return "A generally attractive market profile with more strengths than weaknesses.";

    case "Neutral":
      return "A balanced market profile without a decisive current advantage.";

    case "Weak":
      return "A below-average market profile with meaningful risks or limited market support.";

    case "Very Weak":
      return "A materially weak market profile that currently lacks dependable support.";

    default:
      return "The available market data does not support a decisive assessment.";
  }
}


function getConfidenceDescription(
  confidence:
    MarketRatingResult["confidence"],
) {
  switch (confidence) {
    case "High":
      return "High reliability";

    case "Medium":
      return "Moderate reliability";

    case "Low":
      return "Limited reliability";

    case "Insufficient":
      return "Insufficient data";

    default:
      return "Reliability unavailable";
  }
}


function renderStars(
  stars: number,
) {
  return Array.from(
    {
      length: 5,
    },
    (
      _,
      index,
    ) => {
      const starNumber =
        index + 1;

      const starClass =
        stars >= starNumber
          ? "filled"
          : stars >=
              starNumber - 0.5
            ? "half"
            : "";

      return (
        <span
          key={
            starNumber
          }
          className={`market-rating-star ${starClass}`}
          aria-hidden="true"
        >
          ★
        </span>
      );
    },
  );
}


const scoreItems = [
  {
    key:
      "trendScore",

    label:
      "Trend",

    icon:
      "↗",
  },

  {
    key:
      "marketHealthScore",

    label:
      "Market health",

    icon:
      "●",
  },

  {
    key:
      "riskAdjustedScore",

    label:
      "Risk adjusted",

    icon:
      "◈",
  },

  {
    key:
      "valuationScore",

    label:
      "Valuation",

    icon:
      "$",
  },
] as const;


export default function MarketRating({
  rating,
}: MarketRatingProps) {
  const ratingClass =
    getRatingClass(
      rating.rating,
    );


  return (
    <section className="market-rating-card">
      <div className="market-rating-header">
        <div className="market-rating-heading">
          <span className="section-kicker">
            TCGMVP Intelligence
          </span>

          <h2>
            Market Rating
          </h2>

          <p>
            A consolidated assessment of trend,
            market health, risk, and valuation.
          </p>
        </div>


        <div className="market-rating-confidence">
          <span className="market-rating-confidence-label">
            Reliability
          </span>

          <strong>
            {rating.confidenceScore}
            <small>
              /100
            </small>
          </strong>

          <span className="market-rating-confidence-description">
            {getConfidenceDescription(
              rating.confidence,
            )}
          </span>
        </div>
      </div>


      <div className="market-rating-hero">
        <div
          className={`market-rating-score-card ${ratingClass}`}
        >
          <div className="market-rating-score-value">
            <span>
              {rating.ratingScore}
            </span>

            <small>
              /100
            </small>
          </div>


          <div className="market-rating-score-label">
            {rating.rating}
          </div>


          <div
            className="market-rating-stars"
            aria-label={`${rating.stars} out of 5 stars`}
          >
            {renderStars(
              rating.stars,
            )}
          </div>
        </div>


        <div className="market-rating-summary">
          <span className="market-rating-summary-label">
            Overall assessment
          </span>

          <h3 className={ratingClass}>
            {getRatingInterpretation(
              rating.rating,
            )}
          </h3>

          <p>
            {rating.summary}
          </p>
        </div>
      </div>


      <div className="market-rating-breakdown">
        {scoreItems.map(
          (item) => {
            const value =
              rating[
                item.key
              ];

            return (
              <div
                key={
                  item.key
                }
                className="market-rating-metric"
              >
                <div className="market-rating-metric-top">
                  <span className="market-rating-metric-icon">
                    {
                      item.icon
                    }
                  </span>

                  <span className="market-rating-metric-label">
                    {
                      item.label
                    }
                  </span>
                </div>

                <strong>
                  {value}
                </strong>

                <div className="market-rating-metric-bar">
                  <span
                    style={{
                      width:
                        `${value}%`,
                    }}
                  />
                </div>
              </div>
            );
          },
        )}
      </div>


      <div className="market-rating-insights">
        <div className="market-rating-insight-column market-rating-strengths">
          <div className="market-rating-insight-heading">
            <span>
              ✓
            </span>

            <h4>
              Strengths
            </h4>
          </div>

          {rating.strengths.length >
          0 ? (
            <ul>
              {rating.strengths.map(
                (
                  strength,
                ) => (
                  <li
                    key={
                      strength
                    }
                  >
                    <span>
                      ✓
                    </span>

                    <p>
                      {
                        strength
                      }
                    </p>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="market-rating-empty">
              No significant strengths identified.
            </p>
          )}
        </div>


        <div className="market-rating-insight-column market-rating-concerns">
          <div className="market-rating-insight-heading">
            <span>
              !
            </span>

            <h4>
              Concerns
            </h4>
          </div>

          {rating.concerns.length >
          0 ? (
            <ul>
              {rating.concerns.map(
                (
                  concern,
                ) => (
                  <li
                    key={
                      concern
                    }
                  >
                    <span>
                      !
                    </span>

                    <p>
                      {
                        concern
                      }
                    </p>
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="market-rating-empty">
              No significant concerns identified.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}