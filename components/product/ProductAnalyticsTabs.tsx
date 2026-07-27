"use client";

import { useState } from "react";

import type {
  MarketHealthResult,
} from "@/lib/analytics/marketHealth";

import type {
  DealScoreResult,
} from "@/lib/analytics/dealScore";

import type {
  InvestmentGradeResult,
} from "@/lib/analytics/investmentGrade";

type AnalyticsTab =
  | "market-health"
  | "deal-score"
  | "investment-grade";

type ProductAnalyticsTabsProps = {
  marketHealth: MarketHealthResult;
  dealScore: DealScoreResult | null;
  investmentGrade: InvestmentGradeResult;
};

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return `${value.toFixed(1)}%`;
}

export default function ProductAnalyticsTabs({
  marketHealth,
  dealScore,
  investmentGrade,
}: ProductAnalyticsTabsProps) {
  const [activeTab, setActiveTab] =
    useState<AnalyticsTab>("market-health");

  return (
    <div className="product-analytics-tabs">
      <div
        className="product-analytics-tab-list"
        role="tablist"
        aria-label="TCGMVP analytics"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "market-health"}
          className={
            activeTab === "market-health"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() => setActiveTab("market-health")}
        >
          Market Health
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "deal-score"}
          className={
            activeTab === "deal-score"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() => setActiveTab("deal-score")}
        >
          Deal Score
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "investment-grade"}
          className={
            activeTab === "investment-grade"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() => setActiveTab("investment-grade")}
        >
          Investment Grade
        </button>
      </div>

      <div className="product-analytics-tab-panel">
        {activeTab === "market-health" && (
          <div className="analytics-detail-panel">
            <div className="analytics-detail-hero">
              <div>
                <span className="analytics-detail-kicker">
                  Market Health
                </span>

                <h3>{marketHealth.label}</h3>

                <p>
                  Measures liquidity, supply balance, and
                  recent price stability across the tracked
                  market.
                </p>
              </div>

              <div className="analytics-primary-score">
                <strong>{marketHealth.score}</strong>
                <span>/100</span>
              </div>
            </div>

            <div className="analytics-metric-grid">
              <div>
                <span>Liquidity</span>
                <strong>{marketHealth.liquidityScore}</strong>
              </div>

              <div>
                <span>Supply balance</span>
                <strong>
                  {marketHealth.supplyBalanceScore}
                </strong>
              </div>

              <div>
                <span>Price stability</span>
                <strong>
                  {marketHealth.priceStabilityScore}
                </strong>
              </div>

              <div>
                <span>Tracked sales</span>
                <strong>{marketHealth.salesCount}</strong>
              </div>

              <div>
                <span>Active listings</span>
                <strong>
                  {marketHealth.activeListingsCount}
                </strong>
              </div>

              <div>
                <span>Price variation</span>
                <strong>
                  {formatPercent(
                    marketHealth.priceVariationPercent,
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "deal-score" && (
          <div className="analytics-detail-panel">
            {dealScore ? (
              <>
                <div className="analytics-detail-hero">
                  <div>
                    <span className="analytics-detail-kicker">
                      Deal Score
                    </span>

                    <h3>{dealScore.label}</h3>

                    <p>
                      Evaluates the lowest tracked listing
                      against recent fair market value,
                      liquidity, and sales confidence.
                    </p>
                  </div>

                  <div className="analytics-primary-score">
                    <strong>{dealScore.score}</strong>
                    <span>/100</span>
                  </div>
                </div>

                <div className="analytics-metric-grid">
                  <div>
                    <span>Price score</span>
                    <strong>{dealScore.priceScore}</strong>
                  </div>

                  <div>
                    <span>Discount to value</span>
                    <strong>
                      {dealScore.discountPercent >= 0
                        ? "+"
                        : ""}
                      {dealScore.discountPercent.toFixed(1)}%
                    </strong>
                  </div>

                  <div>
                    <span>Confidence score</span>
                    <strong>
                      {dealScore.confidenceScore}
                    </strong>
                  </div>

                  <div>
                    <span>Liquidity score</span>
                    <strong>
                      {dealScore.liquidityScore}
                    </strong>
                  </div>

                  <div>
                    <span>Confidence</span>
                    <strong>
                      {dealScore.confidenceLabel}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="analytics-empty-state">
                <span className="analytics-detail-kicker">
                  Deal Score
                </span>

                <h3>Not enough data</h3>

                <p>
                  A Deal Score requires both a valid fair
                  market value and at least one active listing.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "investment-grade" && (
          <div className="analytics-detail-panel">
            <div className="analytics-detail-hero">
              <div>
                <span className="analytics-detail-kicker">
                  Investment Grade
                </span>

                <h3>
                  {investmentGrade.grade} ·{" "}
                  {investmentGrade.label}
                </h3>

                <p>
                  Combines underlying market quality with
                  current deal attractiveness while limiting
                  the influence of temporary discounts.
                </p>
              </div>

              <div className="analytics-grade-score">
                <strong>{investmentGrade.grade}</strong>
                <span>{investmentGrade.score}/100</span>
              </div>
            </div>

            <div className="analytics-metric-grid">
              <div>
                <span>Overall score</span>
                <strong>{investmentGrade.score}</strong>
              </div>

              <div>
                <span>Market quality</span>
                <strong>
                  {investmentGrade.marketQualityScore}
                </strong>
              </div>

              <div>
                <span>Opportunity</span>
                <strong>
                  {investmentGrade.opportunityScore}
                </strong>
              </div>

              <div>
                <span>Risk score</span>
                <strong>
                  {investmentGrade.riskScore}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}