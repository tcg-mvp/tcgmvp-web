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
| Market Statistics | Yes | High / Medium / Low / Insufficient | Calculates confidence from verified sales data. This represents **sales data confidence**, not overall market confidence. |
| Trend Analysis | No | High / Medium / Low / Insufficient | Consumes Market Statistics confidence and uses it for trend scoring, explanations, and output. |
| Risk Analysis | TBD | TBD | Audit pending. Risk should remain independent from market confidence. |
| Market Rating | TBD | TBD | Audit pending. Planned to consume shared Market Confidence. |
| Price Target | Yes | Confidence Score (0–100) + High / Medium / Low / Insufficient | Currently recalculates confidence internally from sales, listings, price variation, and trend confidence. Planned to migrate to the shared Market Confidence engine. |
| Investment Outlook | TBD | TBD | Audit pending. Planned to consume shared Market Confidence. |

---

# Confidence Architecture

## Internal Sales Confidence

**Owner:** Market Statistics

**Purpose:**

Measures the reliability of historical sales data based primarily on verified sales activity.

**Consumers:**

- Trend Analysis (current)
- Internal analytics

---

## Shared Market Confidence

**Owner:** Shared Confidence Engine (`confidence.ts`)

**Purpose:**

Measures the completeness and reliability of the overall market evidence available for a product.

Factors include:

- Recent sales
- Active listings
- Price history depth
- Current price availability
- Fair value availability
- Data freshness

**Consumers (planned):**

- Trend Analysis
- Market Rating
- Price Target
- Investment Outlook

---

## Risk Analysis

Risk is intentionally independent from confidence.

Risk measures the characteristics of the investment itself (volatility, liquidity, downside risk, etc.), while Market Confidence measures the quality of the available evidence.