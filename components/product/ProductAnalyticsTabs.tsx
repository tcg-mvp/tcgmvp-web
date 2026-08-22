"use client";

import {
  useState,
} from "react";

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
  marketHealth:
    MarketHealthResult;

  dealScore:
    DealScoreResult | null;

  investmentGrade:
    InvestmentGradeResult;
};

function formatPercent(
  value: number | null,
) {
  if (value === null) {
    return "N/A";
  }

  return `${value.toFixed(1)}%`;
}

function formatSignedPercent(
  value: number,
) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(
    1,
  )}%`;
}

function getPricePositionLabel(
  discountPercent: number,
) {
  if (discountPercent >= 10) {
    return "Meaningfully Below Fair Value";
  }

  if (discountPercent >= 3) {
    return "Below Fair Value";
  }

  if (discountPercent > -3) {
    return "Near Fair Value";
  }

  if (discountPercent > -10) {
    return "Above Fair Value";
  }

  return "Meaningfully Above Fair Value";
}

function getScoreLabel(
  score: number,
) {
  if (score >= 85) {
    return "Very Strong";
  }

  if (score >= 70) {
    return "Strong";
  }

  if (score >= 50) {
    return "Moderate";
  }

  if (score >= 30) {
    return "Weak";
  }

  return "Very Weak";
}

function ScoreMetric({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div>
      <span>
        {label}
      </span>

      <strong className="analytics-metric-score">
        {score}
        <small>/100</small>
      </strong>

      <em>
        {getScoreLabel(score)}
      </em>
    </div>
  );
}

export default function ProductAnalyticsTabs({
  marketHealth,
  dealScore,
  investmentGrade,
}: ProductAnalyticsTabsProps) {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<AnalyticsTab>(
      "market-health",
    );

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
          aria-selected={
            activeTab ===
            "market-health"
          }
          className={
            activeTab ===
            "market-health"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() =>
            setActiveTab(
              "market-health",
            )
          }
        >
          Market Health
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "deal-score"
          }
          className={
            activeTab ===
            "deal-score"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() =>
            setActiveTab(
              "deal-score",
            )
          }
        >
          Deal Score
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab ===
            "investment-grade"
          }
          className={
            activeTab ===
            "investment-grade"
              ? "product-analytics-tab active"
              : "product-analytics-tab"
          }
          onClick={() =>
            setActiveTab(
              "investment-grade",
            )
          }
        >
          Investment Grade
        </button>
      </div>

      <div className="product-analytics-tab-panel">
        {activeTab ===
          "market-health" && (
          <div className="analytics-detail-panel">
            <div className="analytics-detail-hero">
              <div>
                <span className="analytics-detail-kicker">
                  Market Health
                </span>

                <h3>
                  {marketHealth.label}
                </h3>

                <p>
                  Measures transaction liquidity,
                  supply balance, and realized-price
                  stability across the tracked market.
                  Component metrics use a 0–100 scale,
                  where higher scores indicate stronger
                  market conditions.
                </p>
              </div>

              <div className="analytics-primary-score">
                <strong>
                  {marketHealth.score}
                </strong>

                <span>
                  /100
                </span>
              </div>
            </div>

            <div className="analytics-metric-grid">
              <ScoreMetric
                label="Liquidity"
                score={
                  marketHealth.liquidityScore
                }
              />

              <ScoreMetric
                label="Supply balance"
                score={
                  marketHealth.supplyBalanceScore
                }
              />

              <ScoreMetric
                label="Price stability"
                score={
                  marketHealth.priceStabilityScore
                }
              />

              <div>
                <span>
                  Verified sales
                </span>

                <strong>
                  {marketHealth.salesCount}
                </strong>

                <em>
                  Recent transactions
                </em>
              </div>

              <div>
                <span>
                  Active listings
                </span>

                <strong>
                  {marketHealth.activeListingsCount}
                </strong>

                <em>
                  Visible market supply
                </em>
              </div>

              <div>
                <span>
                  Price variation
                </span>

                <strong>
                  {formatPercent(
                    marketHealth.priceVariationPercent,
                  )}
                </strong>

                <em>
                  Lower is more stable
                </em>
              </div>
            </div>
          </div>
        )}

        {activeTab ===
          "deal-score" && (
          <div className="analytics-detail-panel">
            {dealScore ? (
              <>
                <div className="analytics-detail-hero">
                  <div>
                    <span className="analytics-detail-kicker">
                      Deal Score
                    </span>

                    <h3>
                      {dealScore.label}
                    </h3>

                    <p>
                      Measures how attractive the
                      current actionable entry price
                      is relative to TCGMVP estimated
                      Fair Value. Scores use a 0–100
                      scale, with higher values
                      representing more attractive
                      valuation.
                    </p>
                  </div>

                  <div className="analytics-primary-score">
                    <strong>
                      {dealScore.score}
                    </strong>

                    <span>
                      /100
                    </span>
                  </div>
                </div>

                <div className="analytics-metric-grid">
                  <ScoreMetric
                    label="Valuation score"
                    score={
                      dealScore.priceScore
                    }
                  />

                  <div>
                    <span>
                      Discount / premium
                    </span>

                    <strong>
                      {formatSignedPercent(
                        dealScore.discountPercent,
                      )}
                    </strong>

                    <em>
                      Versus Fair Value
                    </em>
                  </div>

                  <div>
                    <span>
                      Price position
                    </span>

                    <strong className="analytics-metric-text-value">
                      {getPricePositionLabel(
                        dealScore.discountPercent,
                      )}
                    </strong>

                    <em>
                      Current valuation
                    </em>
                  </div>
                </div>
              </>
            ) : (
              <div className="analytics-empty-state">
                <span className="analytics-detail-kicker">
                  Deal Score
                </span>

                <h3>
                  Not enough data
                </h3>

                <p>
                  A Deal Score requires both a valid
                  actionable entry price and a Fair
                  Value estimate.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab ===
          "investment-grade" && (
          <div className="analytics-detail-panel">
            <div className="analytics-detail-hero">
              <div>
                <span className="analytics-detail-kicker">
                  Investment Grade
                </span>

                <h3>
                  {investmentGrade.grade}
                  <span className="investment-grade-separator"> : </span>
                  {investmentGrade.label}
                </h3>

                <p>
                  Combines underlying market quality
                  with current valuation opportunity
                  while keeping risk analysis
                  separate. Component scores use a
                  0–100 scale.
                </p>
              </div>

              <div className="analytics-grade-score">
                <strong>
                  {investmentGrade.grade}
                </strong>

                <span>
                  {investmentGrade.score}
                  /100
                </span>
              </div>
            </div>

            <div className="analytics-metric-grid">
              <ScoreMetric
                label="Overall score"
                score={
                  investmentGrade.score
                }
              />

              <ScoreMetric
                label="Market quality"
                score={
                  investmentGrade.marketQualityScore
                }
              />

              <ScoreMetric
                label="Current opportunity"
                score={
                  investmentGrade.opportunityScore
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}