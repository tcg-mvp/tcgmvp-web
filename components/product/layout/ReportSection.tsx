import type { ReactNode } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

type ReportSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
};

export default function ReportSection({
  eyebrow,
  title,
  description,
  className = "",
  children,
}: ReportSectionProps) {
  return (
    <section className={`product-report-section ${className}`.trim()}>
      <div className="container">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        {children}
      </div>
    </section>
  );
}
