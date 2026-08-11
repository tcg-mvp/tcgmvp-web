import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  calculateFairValue,
} from "@/lib/analytics/fairValue";

import {
  calculateMarketHealth,
} from "@/lib/analytics/marketHealth";

import {
  calculateDealScore,
} from "@/lib/analytics/dealScore";
import InvestmentOutlook from "@/components/product/InvestmentOutlook";
import {
  calculateInvestmentOutlook,
} from "@/lib/analytics/investmentOutlook";
import {
  calculateInvestmentGrade,
} from "@/lib/analytics/investmentGrade";
import MarketStatistics from "@/components/product/MarketStatistics";
import { calculateMarketStatistics } from "@/lib/analytics/marketStatistics";
import TrendAnalysis from "@/components/product/TrendAnalysis";
import { calculateTrendAnalysis } from "@/lib/analytics/trendAnalysis";
import RiskAnalysis from "@/components/product/RiskAnalysis";
import { calculateRiskAnalysis } from "@/lib/analytics/riskAnalysis";
import MarketRating from "@/components/product/MarketRating";
import {
  calculateMarketRating,
} from "@/lib/analytics/marketRating";
import { calculatePriceTarget } from "@/lib/analytics/priceTarget";
import PriceTarget from "@/components/product/PriceTarget";
import MarketConfidence from "@/components/product/MarketConfidence";
import {
  calculateConfidence,
} from "@/lib/analytics/confidence";
import ProductAnalyticsTabs from "@/components/product/ProductAnalyticsTabs";
import ProductTabs from "@/components/product/ProductTabs";
import MarketIntelligenceSummary from "@/components/ui/MarketIntelligenceSummary";
import ProductHero from "@/components/product/layout/ProductHero";
import ResearchSummary from "@/components/product/layout/ResearchSummary";
import ReportSection from "@/components/product/layout/ReportSection";
import AnalyticsGrid from "@/components/product/layout/AnalyticsGrid";
import EvidenceSection from "@/components/product/layout/EvidenceSection";
import { supabase } from "@/lib/supabase";
import { calculateMarketData } from "@/lib/analytics/marketData";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type MarketSale = {
  id: number;
  marketplace: string;
  title: string;
  sale_price: number | string;
  shipping_price: number | string;
  total_price: number | string | null;
  sale_type: string | null;
  sold_at: string;
  listing_url: string | null;
  is_verified: boolean;
};
type MarketListing = {
  id: number;
  marketplace: string;
  title: string;
  listing_price: number | string;
  shipping_price: number | string;
  total_price: number | string | null;
  listing_type: string | null;
  seller_name: string | null;
  seller_feedback: number | string | null;
  listing_url: string | null;
  listed_at: string | null;
  last_seen: string | null;
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      image_url,
      sets (
        name,
        overview,
        series (
          name
        )
      ),
      languages (
        name
      ),
      product_types (
        name
      ),
      daily_market_metrics (
        metric_date,
        market_price,
        marketplace_id
      ),
      product_market_summary (
        current_market_price,
        change_30d_percent
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !product) {
    notFound();
  }

  const { data: salesData, error: salesError } = await supabase
    .from("market_sales")
    .select(`
      id,
      marketplace,
      title,
      sale_price,
      shipping_price,
      total_price,
      sale_type,
      sold_at,
      listing_url,
      is_verified
    `)
    .eq("product_id", product.id)
    .order("sold_at", { ascending: false })
    .limit(10);

  if (salesError) {
    console.error("Unable to load market sales:", salesError.message);
  }

  const marketSales = (salesData ?? []) as MarketSale[];
  const { data: listingsData, error: listingsError } = await supabase
  .from("market_listings")
  .select(`
    id,
    marketplace,
    title,
    listing_price,
    shipping_price,
    total_price,
    listing_type,
    seller_name,
    seller_feedback,
    listing_url,
    listed_at,
    last_seen
  `)
  .eq("product_id", product.id)
  .order("total_price", { ascending: true })
  .limit(10);

if (listingsError) {
  console.error(
    "Unable to load market listings:",
    listingsError.message
  );
}

const marketListings =
  (listingsData ?? []) as MarketListing[];

  const salePrices = marketSales
  .map((sale) =>
    Number(
      sale.total_price ??
      Number(sale.sale_price) +
      Number(sale.shipping_price)
    )
  )
  .filter((price) => Number.isFinite(price));

const listingPrices = marketListings
  .map((listing) =>
    Number(
      listing.total_price ??
      Number(listing.listing_price) +
      Number(listing.shipping_price)
    )
  )
  .filter((price) => Number.isFinite(price));

  const setData = Array.isArray(product.sets)
    ? product.sets[0]
    : product.sets;

  const seriesData = Array.isArray(setData?.series)
    ? setData.series[0]
    : setData?.series;

  const languageData = Array.isArray(product.languages)
    ? product.languages[0]
    : product.languages;

  const productTypeData = Array.isArray(product.product_types)
    ? product.product_types[0]
    : product.product_types;

  const priceHistory = Array.isArray(product.daily_market_metrics)
    ? product.daily_market_metrics
        .filter(
          (item) =>
            item.marketplace_id === 2 &&
            item.market_price !== null
        )
        .map((item) => ({
          price: Number(item.market_price),
          recorded_at: item.metric_date,
        }))
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime()
        )
    : [];
  const historicalMarketData =
    calculateMarketData(priceHistory);

  const marketSummary = Array.isArray(
    product.product_market_summary
  )
    ? product.product_market_summary[0]
    : product.product_market_summary;

  const marketPrice =
    marketSummary?.current_market_price !== null &&
    marketSummary?.current_market_price !== undefined
      ? Number(marketSummary.current_market_price)
      : historicalMarketData.marketPrice;

  const change30d =
    marketSummary?.change_30d_percent !== null &&
    marketSummary?.change_30d_percent !== undefined
      ? Number(marketSummary.change_30d_percent)
      : historicalMarketData.change30d;    
      
  const fairValue = calculateFairValue({
  sales: salePrices,
});

  const marketHealth = calculateMarketHealth({
    sales: salePrices,
    listings: listingPrices,
  });

const lowestListingPrice =
  listingPrices.length > 0
    ? Math.min(...listingPrices)
    : null;

const dealScore =
  fairValue.fairValue !== null &&
  lowestListingPrice !== null
    ? calculateDealScore({
        fairMarketValue: fairValue.fairValue,
        listingPrice: lowestListingPrice,
        recentSalesCount: marketSales.length,
        activeListingsCount: marketListings.length,
      })
    : null;

/*
 * A neutral score is used when there is not enough data
 * to calculate a dependable Deal Score.
 */
const dealScoreValue = dealScore?.score ?? 50;

const investmentGrade =
  calculateInvestmentGrade({
    marketHealthScore:
      marketHealth.score,
    liquidityScore:
      marketHealth.liquidityScore,
    supplyBalanceScore:
      marketHealth.supplyBalanceScore,
    priceStabilityScore:
      marketHealth.priceStabilityScore,
    dealScore:
      dealScoreValue,
  });
  const marketStatistics = calculateMarketStatistics(
    priceHistory,
    marketSales
  ); 
const sharedConfidence = calculateConfidence({
  recentSalesCount: marketSales.length,
  activeListingsCount: marketListings.length,
  priceHistoryPoints: priceHistory.length,

  hasCurrentPrice:
    marketPrice !== null &&
    marketPrice !== undefined,

  hasFairValue:
    fairValue.fairValue !== null &&
    fairValue.fairValue !== undefined,

  dataAgeDays: 1,
});
  const trendAnalysis =
  calculateTrendAnalysis(marketStatistics);

  const riskAnalysis =
  calculateRiskAnalysis(
    marketStatistics,
    trendAnalysis
  );
const priceTarget = calculatePriceTarget({
  currentPrice: marketPrice,
  fairValue: fairValue.fairValue,

  trendScore: trendAnalysis.strength,
  riskScore: riskAnalysis.riskScore,
  marketHealthScore: marketHealth.score,
  investmentGradeScore: investmentGrade.score,

marketConfidenceScore:
  sharedConfidence.score,

marketConfidence:
  sharedConfidence.confidence,
});

const marketRating =
  calculateMarketRating({
    currentPrice: marketPrice,
    trendAnalysis,
    riskAnalysis,
    fairValue,
    marketHealth,
    investmentGrade,

    marketConfidenceScore:
      sharedConfidence.score,

    marketConfidence:
      sharedConfidence.confidence,
  });
  
const investmentOutlook =
  calculateInvestmentOutlook({
    currentPrice: marketPrice,
    fairValue: fairValue.fairValue,

    marketRatingScore:
      marketRating.ratingScore,

    trendScore:
      trendAnalysis.strength,

    riskScore:
      riskAnalysis.riskScore,

    marketHealthScore:
      marketHealth.score,

    investmentGradeScore:
      investmentGrade.score,

    expectedReturnPercent:
      priceTarget.potentialUpsidePercent,

    recentSalesCount:
      marketSales.length,

    activeListingsCount:
      marketListings.length,

    marketConfidenceScore:
      sharedConfidence.score,

    marketConfidence:
      sharedConfidence.confidence,

    change30d:
      marketStatistics.change30d,
  });


  const overviewName = product.name.replace(" Booster Box", "");
  const heroFairValue = fairValue.fairValue;
  const heroUpside = priceTarget.potentialUpsidePercent;
  const keySignal =
    investmentOutlook.strengths[0] ??
    marketRating.strengths[0] ??
    "Market conditions are balanced";
  const primaryConcern =
    investmentOutlook.headwinds[0] ??
    marketRating.concerns[0] ??
    "No major concern identified";

  const changeTone =
    change30d === null
      ? "neutral"
      : change30d < 0
        ? "negative"
        : "positive";

  return (
    <main className="site-shell products-page product-detail-page product-research-report">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="nav-wrap">
        <nav className="nav container">
          <Link className="brand" href="/">
            <Image
              src="/tcgmvp-mark.png"
              alt="TCGMVP"
              width={48}
              height={48}
              className="brand-logo"
              priority
            />
            <span>TCGMVP</span>
          </Link>

          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/products">Market</Link>
            <span>Portfolio</span>
            <span>Watchlist</span>
          </div>

          <Link className="button button-small button-primary" href="/products">
            Back to market
            <span>↗</span>
          </Link>
        </nav>
      </header>

      <ProductHero
        imageUrl={product.image_url}
        productName={overviewName}
        productType={productTypeData?.name ?? "Sealed Product"}
        seriesName={seriesData?.name ?? "Unknown Series"}
        languageName={languageData?.name ?? "Unknown Language"}
        marketPrice={formatCurrency(marketPrice)}
        change30d={formatPercent(change30d)}
        changeTone={changeTone}
        metrics={[
        {
          label: "Market Rating",
          value: `${marketRating.ratingScore}/100`,
          detail: marketRating.rating,
          featured: true,
          detailTone:
            marketRating.ratingScore >= 70
              ? "positive"
              : marketRating.ratingScore < 40
                ? "negative"
                : "gold",
        },

          {
            label: "Fair Value",
            value: formatCurrency(heroFairValue),

            detail:
              heroUpside === null
                ? "Upside unavailable"
                : `${heroUpside >= 0 ? "+" : ""}${heroUpside.toFixed(1)}% target potential`,

            detailTone:
              heroUpside === null
                ? "default"
                : heroUpside > 0
                  ? "positive"
                  : heroUpside < 0
                    ? "negative"
                    : "default",
          },

          {
            label: "Confidence",

            value: sharedConfidence.confidence,

            detail: `${sharedConfidence.score}/100 evidence score`,

            valueTone:
              sharedConfidence.confidence === "High"
                ? "positive"
                : sharedConfidence.confidence === "Medium"
                  ? "warning"
                  : sharedConfidence.confidence === "Low"
                    ? "negative"
                    : "default",

            detailTone: "default",
          },
        ]}
      />

      <ResearchSummary
        summary={
          <MarketIntelligenceSummary
            productName={overviewName}
            rating={marketRating.rating}
            ratingScore={marketRating.ratingScore}
            outlook={investmentOutlook.overallOutlook}
            summary={investmentOutlook.summary || marketRating.summary}
            keySignal={keySignal}
            primaryConcern={primaryConcern}
            confidence={sharedConfidence.confidence}
            confidenceScore={sharedConfidence.score}
          />
        }
        overview={setData?.overview ?? "Product overview is not available yet."}
      />

      <ReportSection
        eyebrow="Investment Thesis"
        title="Market Intelligence"
        description="The platform's primary conclusion, forward outlook, valuation target, and supporting evidence confidence."
        className="product-intelligence-section product-intelligence-section-v2"
      >
        <MarketRating rating={marketRating} />

        <div className="product-investment-outlook-wrapper">
          <InvestmentOutlook outlook={investmentOutlook} />
        </div>

        <AnalyticsGrid className="product-price-target-wrapper product-price-target-wrapper-v2">
          <PriceTarget priceTarget={priceTarget} />
          <MarketConfidence confidence={sharedConfidence} />
        </AnalyticsGrid>
      </ReportSection>

      <ReportSection
        eyebrow="Market Context"
        title="Market Statistics"
        description="Price behavior and market activity used to frame the intelligence above."
        className="product-statistics-section product-statistics-section-v2 product-report-section-compact"
      >
        <MarketStatistics statistics={marketStatistics} />
      </ReportSection>

      <ReportSection
        eyebrow="Direction & Risk"
        title="Market Analysis"
        description="A focused view of current momentum, trend quality, volatility, and downside exposure."
        className="product-direction-section"
      >
        <AnalyticsGrid columns={1} className="product-intelligence-supporting">
          <TrendAnalysis analysis={trendAnalysis} />
          <RiskAnalysis analysis={riskAnalysis} />
        </AnalyticsGrid>
      </ReportSection>

      <ReportSection
        eyebrow="TCGMVP Analytics"
        title="Supporting Analysis"
        description="Explore the market-quality, valuation, and investment metrics supporting the overall Market Rating."
        className="product-analytics-section"
      >
        <ProductAnalyticsTabs
          marketHealth={marketHealth}
          dealScore={dealScore}
          investmentGrade={investmentGrade}
        />
      </ReportSection>

      <EvidenceSection>
        <ProductTabs
          priceHistory={priceHistory}
          sales={marketSales}
          listings={marketListings}
        />
      </EvidenceSection>
    </main>
  );
}
