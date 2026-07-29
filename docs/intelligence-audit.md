# TCGMVP Intelligence Audit

## Evolving Skies

| Engine | Result | Notes |
|---------|---------|------|
| Market Rating | Neutral (62) | Reasonable |
| Price Target | Good (+8.4%) | Positive upside |
| Investment Outlook | Bullish | Consistent |
| Trend | Bullish | Consistent |
| Risk | Low | Supports thesis |
| Investment Grade | Strong | Supports thesis |

Overall consistency:

✅ High

---

## Chilling Reign

| Engine | Result | Notes |
|---------|---------|------|
| Market Rating | Neutral (60) | Reasonable |
| Price Target | Limited (-3.2%) | Above fair value |
| Investment Outlook | Neutral | Consistent |
| Trend | Neutral | Consistent |
| Risk | Moderate | Supports thesis |
| Investment Grade | Strong | Good fundamentals |

Overall consistency:

✅ High

---

## Team Up

| Engine | Result | Notes |
|---------|---------|------|
| Market Rating | Unrated | No data |
| Price Target | Unrated | No data |
| Investment Outlook | Unknown | No data |
| Trend | Insufficient | No data |
| Risk | High Data Risk | Expected |
| Investment Grade | Unrated | Expected |

Overall consistency:

✅ Excellent

---
# Confidence Logic Inventory

| Engine | Calculates Confidence Internally? | Output Type | Notes |
|---|---|---|---|
| Market Statistics | Yes | High / Medium / Low / Insufficient | Calculates sales-data confidence primarily from verified-sale volume. This represents the reliability of sales evidence, not overall market confidence. |
| Trend Analysis | No | High / Medium / Low / Insufficient | Inherits Market Statistics confidence and uses it for score adjustment, explanation, and output. It does not currently calculate genuine trend-specific confidence. |
| Risk Analysis | No, but consumes confidence | Data Risk: Very Low / Low / Moderate / High / Very High | Uses Market Statistics confidence in Liquidity Risk and Data Risk. Data Risk currently contributes 20% to Overall Risk, meaning risk is not yet fully independent from confidence. |
| Market Rating | Yes | Confidence Score (0–100) + High / Medium / Low / Insufficient | Recalculates confidence from inherited trend confidence, Risk Analysis data risk, sales sample size, and agreement between analytics engines. Planned to consume Shared Market Confidence instead. |
| Price Target | Yes | Confidence Score (0–100) + High / Medium / Low / Insufficient | Recalculates confidence from sales, listings, price variation, and trend confidence. Planned to consume Shared Market Confidence instead. |
| Investment Outlook | No — consumes an external confidence score | Confidence Score (0–100) + High / Medium / Low / Insufficient | Receives confidenceScore from another engine, currently Price Target. Converts the score into a label and uses it to limit extreme outlook conclusions. Planned to consume Shared Market Confidence directly. |

---

# Confidence Architecture

## Internal Sales-Data Confidence

**Owner:** Market Statistics

**Purpose:**

Measures the reliability of the available sales evidence, primarily from verified-sale volume.

**Current consumers:**

- Trend Analysis
- Risk Analysis

**Planned role:**

Remain an internal supporting signal. Consider renaming the field from `confidence` to `salesDataConfidence` during a later compatibility-safe refactor.

---

## Shared Market Confidence

**Owner:** Shared Confidence Engine (`confidence.ts`)

**Purpose:**

Measures the completeness and reliability of the overall market evidence available for a product.

**Factors:**

- Recent sales
- Active listings
- Price-history depth
- Current-price availability
- Fair-value availability
- Data freshness

**Planned consumers:**

- Trend Analysis
- Market Rating
- Price Target
- Investment Outlook

This should be the primary confidence measure displayed to users across the TCGMVP Intelligence suite.

---

## Risk Architecture

Risk and confidence represent different concepts:

- **Risk:** How risky the product or market conditions are.
- **Confidence:** How dependable the available evidence is.

Risk Analysis should remain independent from Shared Market Confidence when calculating intrinsic investment risk.

The current implementation is not fully independent because Market Statistics confidence affects:

- Liquidity Risk
- Data Risk
- Overall Risk

**Planned refinement:**

- Calculate Liquidity Risk from observable liquidity evidence such as sales volume and listing depth.
- Keep Data Risk as a separate informational output.
- Remove Data Risk from the intrinsic Overall Risk score, or clearly rename the combined score if data uncertainty remains included.
- Display Shared Market Confidence alongside Risk Analysis rather than blending it into the investment-risk score.
## Long-term set up
Sales Data Confidence
    Internal evidence signal

Shared Market Confidence
    One visible platform-wide confidence measure
        ├── Trend Analysis
        ├── Market Rating
        ├── Price Target
        └── Investment Outlook

Risk Analysis
    Volatility
    Liquidity
    Valuation
    Other intrinsic risk factors

Data Risk
    Separate context, not part of intrinsic risk