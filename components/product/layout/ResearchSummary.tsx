import type { ReactNode } from "react";

type ResearchSummaryProps = {
  summary: ReactNode;
  overview: string;
};

export default function ResearchSummary({
  summary,
  overview,
}: ResearchSummaryProps) {
  return (
    <div className="product-research-intro">
      <section className="product-intelligence-summary-section">
        <div className="container">{summary}</div>
      </section>

      <section className="product-overview-section product-overview-section-v2">
        <div className="container">
          <div className="product-overview-panel">
            <span className="section-kicker">Product overview</span>
            <p>{overview}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
