# TCGMVP Roadmap

## Vision

Build the premier market intelligence platform for Pokémon sealed products by transforming raw marketplace data into transparent, evidence-based market intelligence for collectors and investors.

---

# Core Intelligence Engines

These proprietary analytics engines form the foundation of TCGMVP.

## Completed

- [x] Market Statistics Engine
- [x] Fair Value Engine
- [x] Market Health Engine
- [x] Deal Score Engine
- [x] Investment Grade Engine
- [x] Trend Analysis Engine
- [x] Risk Analysis Engine
- [x] Market Rating Engine
- [x] Price Target Engine
- [x] Investment Outlook Engine
- [x] Market Confidence Engine

---

# Phase 1 – Foundation

## Platform

- [x] Landing page
- [x] Products page
- [x] Dynamic product pages
- [x] Responsive UI
- [x] Supabase integration
- [x] GitHub repository
- [x] Automatic Vercel deployment

## Product Catalog

- [x] Product database
- [x] Product images
- [x] Product metadata
- [x] Dynamic routing

---

# Phase 2 – Intelligence Platform

## Market Data

- [x] Historical Price Charts
- [x] Market Snapshot
- [x] Market Statistics

## Intelligence Engines

- [x] Fair Value Engine
- [x] Market Health Engine
- [x] Deal Score Engine
- [x] Investment Grade Engine
- [x] Trend Analysis Engine
- [x] Risk Analysis Engine

---

# Phase 3A – Intelligence Suite

The flagship analytics layer of TCGMVP.

## Market Rating Engine

Combines:

- [x] Trend Analysis
- [x] Risk Analysis
- [x] Fair Value
- [x] Investment Grade
- [x] Market Health

Outputs:

- [x] Overall Market Rating
- [x] Rating Score
- [x] Confidence Score
- [x] Supporting Reasons
- [x] Risks and Limitations

---

## Price Target Engine

- [x] Estimated Market Potential
- [x] Expected Return
- [x] Downside Risk
- [x] Margin of Safety
- [x] Market Adjustment
- [x] Valuation Adjustment
- [x] Opportunity Verdict
- [x] Confidence Score
- [x] Supporting Drivers
- [x] Risks and Limitations

---

## Investment Outlook Engine

- [x] Overall Outlook
- [x] Short-Term Outlook
- [x] Long-Term Outlook
- [x] Collector Demand
- [x] Supply Outlook
- [x] Market Maturity
- [x] Confidence Level
- [x] Investment Thesis
- [x] Strengths
- [x] Headwinds
- [x] Insufficient-data handling

---

## Market Confidence Engine

Measures the quality and completeness of the market evidence supporting TCGMVP analytics.

Inputs:

- [x] Recent sales volume
- [x] Active listing depth
- [x] Historical pricing depth
- [x] Current price availability
- [x] Fair value availability
- [x] Data freshness

Outputs:

- [x] Confidence Score
- [x] Confidence Level
- [x] Confidence Factors
- [x] Insufficient-data handling
- [x] Standalone Market Confidence component

---

# Phase 3B – Intelligence Refinement

Strengthen the consistency, reliability, and explainability of the TCGMVP intelligence suite.

## Completed

- [x] Create intelligence audit
- [x] Create shared confidence engine
- [x] Add Market Confidence component
- [x] Add insufficient-data confidence handling
- [x] Establish confidence scoring foundation
- [x] Document intelligence refinement roadmap

## Confidence Unification

- [ ] Audit confidence logic across engines
- [] Replace duplicate Trend Analysis confidence logic
- [x] Replace duplicate Price Target confidence logic
- [x] Replace duplicate Market Rating confidence logic
- [ ] Replace duplicate Investment Outlook confidence logic
- [ ] Standardize confidence terminology across components
- [x] Preserve Risk Analysis as an independent risk model

## Scoring and Consistency

- [ ] Improve analytics scoring
- [ ] Calibrate engine weights and thresholds
- [ ] Improve consistency across engines
- [ ] Add cross-engine contradiction checks
- [ ] Test scoring against a wider product set
- [ ] Document calibration decisions
- [ ] Add regression test cases for key products

## Confidence Model Refinement

- [ ] Add sales recency scoring
- [ ] Add sales cadence scoring
- [ ] Add listing-price consistency scoring
- [ ] Add price-history coverage scoring
- [ ] Replace temporary fixed data freshness
- [ ] Add confidence category breakdowns
- [ ] Improve confidence explanations

## Explanation Quality

- [ ] Improve explanation quality
- [ ] Reduce repetitive analytics language
- [ ] Standardize strengths, drivers, risks, and headwinds
- [ ] Improve short-term versus long-term explanations
- [ ] Improve overvalued and undervalued explanations
- [ ] Improve neutral and mixed-signal explanations
- [ ] Standardize insufficient-data messaging

## Edge-Case Handling

- [ ] Improve missing-data handling
- [ ] Improve low-sales handling
- [ ] Improve no-listing handling
- [ ] Improve no-price-history handling
- [ ] Improve unavailable fair-value handling
- [ ] Improve extreme-price and outlier handling
- [ ] Improve stale-data handling
- [ ] Prevent misleading scores from partial datasets
- [ ] Prevent NaN, Infinity, and invalid percentage outputs

## Intelligence Validation

- [x] Validate Evolving Skies results
- [x] Validate Chilling Reign results
- [x] Validate Team Up insufficient-data behavior
- [ ] Add additional high-liquidity products
- [ ] Add additional low-liquidity products
- [ ] Add overvalued product test cases
- [ ] Add undervalued product test cases
- [ ] Add high-risk product test cases
- [ ] Add conflicting-signal test cases

---

# Phase 3C – Product Experience

Improve the usability, polish, and presentation of the TCGMVP platform.

## Landing Page

- [ ] Hero redesign
- [ ] Scroll animations
- [ ] Interactive intelligence preview
- [ ] Feature highlights
- [ ] Responsive refinement
- [ ] Clear product discovery call to action
- [ ] Intelligence methodology preview

## Products Page

- [ ] Premium product cards
- [ ] Sorting and filtering
- [ ] Search improvements
- [ ] Quick analytics preview
- [ ] Loading states
- [ ] Empty states
- [ ] Pagination or infinite loading
- [ ] Mobile refinement

## Product Pages

- [ ] Intelligence polish
- [ ] Analytics polish
- [ ] Mobile optimization
- [ ] Empty states
- [ ] Loading states
- [ ] Visual consistency
- [ ] Standardize card spacing
- [ ] Standardize score presentation
- [ ] Improve section navigation
- [ ] Improve chart responsiveness
- [ ] Add analytics methodology tooltips

## Accessibility and Quality

- [ ] Keyboard navigation review
- [ ] Color contrast review
- [ ] Screen-reader label review
- [ ] Responsive breakpoint review
- [ ] Cross-browser testing
- [ ] Performance review
- [ ] TypeScript warning cleanup
- [ ] Remove temporary console logging

---

# Phase 4 – Data Platform

Scale the analytics engines with automated and normalized market data.

## Historical Data

- [ ] Historical market storage
- [ ] Daily market snapshots
- [ ] Marketplace normalization
- [ ] Product-level price history
- [ ] Sales-history retention
- [ ] Listing-history retention
- [ ] Data freshness tracking
- [ ] Data-source attribution

## Marketplace Integrations

- [ ] eBay
- [ ] TCGplayer
- [ ] Pokémon Center
- [ ] Additional marketplaces
- [ ] Marketplace-specific normalization
- [ ] Duplicate listing detection
- [ ] Duplicate sale detection
- [ ] Shipping-cost normalization
- [ ] Condition normalization

## Automation

- [ ] Scheduled data imports
- [ ] Daily analytics recalculation
- [ ] Historical trend tracking
- [ ] Failed-import monitoring
- [ ] Data-quality validation
- [ ] Automated stale-data detection
- [ ] Automated outlier detection
- [ ] Analytics recalculation queue

## Data Quality

- [ ] Product matching rules
- [ ] Marketplace title normalization
- [ ] Language detection
- [ ] Product-type detection
- [ ] Sealed-condition validation
- [ ] Suspicious-price filtering
- [ ] Incomplete-listing filtering
- [ ] Manual review workflow
- [ ] Source confidence scoring

---

# Phase 5 – Discovery

Help users discover compelling Pokémon sealed product opportunities.

## Search

- [ ] Product Search
- [ ] Advanced Filters
- [ ] Search by set
- [ ] Search by series
- [ ] Search by product type
- [ ] Search by language
- [ ] Search by price range
- [ ] Search by release year

## Rankings

- [ ] Best Investments
- [ ] Strongest Trends
- [ ] Lowest Risk
- [ ] Highest Upside
- [ ] Most Undervalued
- [ ] Highest Market Confidence
- [ ] Strongest Collector Demand
- [ ] Most Constrained Supply
- [ ] Best Long-Term Outlook
- [ ] Best Short-Term Outlook

## Comparison

- [ ] Product Comparison
- [ ] Historical Comparison
- [ ] Trend Comparison
- [ ] Risk Comparison
- [ ] Market Rating Comparison
- [ ] Price Target Comparison
- [ ] Investment Outlook Comparison
- [ ] Market Confidence Comparison
- [ ] Side-by-side chart comparison

## Discovery Pages

- [ ] Market Overview
- [ ] Trending Products
- [ ] Undervalued Products
- [ ] High-Confidence Products
- [ ] Newly Added Products
- [ ] Recently Updated Products
- [ ] Set-level intelligence pages
- [ ] Series-level intelligence pages

---

# Phase 6 – User Platform

Deliver personalized market intelligence and collection management.

## Accounts

- [ ] User Accounts
- [ ] Authentication
- [ ] User Profiles
- [ ] Account Settings
- [ ] Email preferences
- [ ] Privacy controls

## Portfolio and Collection

- [ ] Portfolio Tracking
- [ ] Collection Analytics
- [ ] Purchase price tracking
- [ ] Quantity tracking
- [ ] Cost-basis tracking
- [ ] Unrealized gain and loss
- [ ] Portfolio allocation
- [ ] Product performance tracking
- [ ] Collection import and export

## Watchlists and Alerts

- [ ] Watchlists
- [ ] Price Alerts
- [ ] Market Rating Alerts
- [ ] Trend Change Alerts
- [ ] Risk Change Alerts
- [ ] Price Target Alerts
- [ ] Investment Outlook Alerts
- [ ] Market Confidence Alerts
- [ ] Data freshness alerts

## Personalized Dashboard

- [ ] Portfolio summary
- [ ] Watchlist summary
- [ ] Opportunity feed
- [ ] Risk alerts
- [ ] Market changes
- [ ] Personalized rankings
- [ ] Recently viewed products
- [ ] Saved comparisons

---

# Phase 7 – AI Intelligence

AI enhances TCGMVP analytics. It does not replace the underlying evidence-based engines.

## AI Market Intelligence

- [ ] AI Product Summary
- [ ] AI Market Summary
- [ ] AI Trend Explanation
- [ ] AI Risk Explanation
- [ ] AI Market Rating Explanation
- [ ] AI Price Target Explanation
- [ ] AI Investment Outlook Explanation
- [ ] AI Market Confidence Explanation
- [ ] AI comparison summaries
- [ ] AI portfolio summaries

## AI Research Assistance

- [ ] Explain conflicting market signals
- [ ] Summarize major price movements
- [ ] Identify unusual market activity
- [ ] Explain valuation changes
- [ ] Explain supply and demand changes
- [ ] Generate product research briefs
- [ ] Generate set research briefs
- [ ] Surface data limitations clearly

## AI Guardrails

- [ ] Require analytics-source grounding
- [ ] Prevent unsupported investment claims
- [ ] Display confidence and limitations
- [ ] Separate factual data from AI interpretation
- [ ] Log AI-generated conclusions
- [ ] Add user-facing AI disclaimers

---

# Future Expansion

## Platform

- [ ] Mobile App
- [ ] Public API
- [ ] Browser Extension
- [ ] Discord Bot
- [ ] Embeddable widgets
- [ ] Partner integrations

## Market Expansion

- [ ] Japanese Market
- [ ] Additional Pokémon Products
- [ ] PSA and Graded Products
- [ ] Other Trading Card Games
- [ ] Sports Cards
- [ ] Additional collectibles markets

## Business Platform

- [ ] Premium subscription
- [ ] Professional analytics tier
- [ ] Marketplace referral partnerships
- [ ] Data licensing
- [ ] API subscriptions
- [ ] Affiliate partnerships
- [ ] Research reports
- [ ] Business intelligence dashboards

---

# Current Priority

## Active Phase

Phase 3B – Intelligence Refinement

## Immediate Next Steps

1. Audit confidence logic across all analytics engines.
2. Create a confidence dependency map.
3. Replace duplicate Trend Analysis confidence logic.
4. Validate changes against Evolving Skies, Chilling Reign, and Team Up.
5. Continue engine migrations one at a time.
6. Calibrate scoring only after confidence unification is stable.