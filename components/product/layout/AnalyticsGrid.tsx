import type { ReactNode } from "react";

type AnalyticsGridProps = {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
};

export default function AnalyticsGrid({
  children,
  columns = 2,
  className = "",
}: AnalyticsGridProps) {
  return (
    <div
      className={`product-report-grid product-report-grid-${columns} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
