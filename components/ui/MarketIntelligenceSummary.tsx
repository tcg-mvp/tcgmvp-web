type MarketIntelligenceSummaryProps = {
  productName: string;
  rating: string;
  ratingScore: number;
  outlook: string;
  summary: string;
  keySignal: string;
  primaryConcern: string;
  confidence: string;
  confidenceScore: number;
};

function getTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("exceptional") ||
    normalized.includes("strong") ||
    normalized.includes("favorable") ||
    normalized.includes("bullish")
  ) {
    return "positive";
  }

  if (
    normalized.includes("weak") ||
    normalized.includes("bearish") ||
    normalized.includes("overpriced")
  ) {
    return "negative";
  }

  return "neutral";
}

export default function MarketIntelligenceSummary({
  productName,
  rating,
  ratingScore,
  outlook,
  summary,
  keySignal,
  primaryConcern,
  confidence,
  confidenceScore,
}: MarketIntelligenceSummaryProps) {
  return (
    <section className="market-intelligence-summary" aria-labelledby="tcgmvp-view-title">
      <div className="market-intelligence-summary-accent" aria-hidden="true" />

      <div className="market-intelligence-summary-copy">
        <span className="market-intelligence-summary-kicker">TCGMVP View</span>
        <h2 id="tcgmvp-view-title">The market case for {productName}</h2>
        <p>{summary}</p>
      </div>

      <div className="market-intelligence-summary-verdicts">
        <div className="market-intelligence-summary-score">
          <span>Market Rating</span>
          <strong>{ratingScore}</strong>
          <small className={getTone(rating)}>{rating}</small>
        </div>

        <div className="market-intelligence-summary-score">
          <span>Investment Outlook</span>
          <strong className={`market-intelligence-summary-word ${getTone(outlook)}`}>
            {outlook}
          </strong>
          <small>Forward view</small>
        </div>
      </div>

      <div className="market-intelligence-summary-signals">
        <div>
          <span>Key signal</span>
          <strong>{keySignal}</strong>
        </div>

        <div>
          <span>Primary concern</span>
          <strong>{primaryConcern}</strong>
        </div>

        <div>
          <span>Evidence confidence</span>
          <strong>{confidence}</strong>
          <small>{confidenceScore}/100</small>
        </div>
      </div>
    </section>
  );
}
