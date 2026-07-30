import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

type EvidenceSectionProps = {
  children: ReactNode;
};

export default function EvidenceSection({ children }: EvidenceSectionProps) {
  return (
    <section className="product-market-data-section product-report-section">
      <div className="container">
        <SectionHeading
          eyebrow="Market Data"
          title="Market Evidence"
          description="Review tracked price history, recent completed sales, and active listings behind the analysis."
        />
      </div>
      {children}
    </section>
  );
}
