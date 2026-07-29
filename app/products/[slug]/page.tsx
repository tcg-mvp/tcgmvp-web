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
import { supabase } from "@/lib/supabase";
import {
  calculateMarketData,
  type PriceHistoryEntry,
} from "@/lib/analytics/marketData";

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
      product_price_history (
        price,
        recorded_at
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

  const priceHistory = Array.isArray(product.product_price_history)
    ? product.product_price_history
        .map((item) => ({
          price: Number(item.price),
          recorded_at: item.recorded_at,
        }))
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime()
        )
    : [];

  const { marketPrice, change30d } =
    calculateMarketData(priceHistory);
    
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


  return (
    <main className="site-shell products-page">
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

          <Link
            className="button button-small button-primary"
            href="/products"
          >
            Back to market
            <span>↗</span>
          </Link>
        </nav>
      </header>

      <section className="product-detail-hero">
        <div className="container product-detail-hero-grid">
          <div className="product-detail-image-area">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={`${product.name} product image`}
                width={600}
                height={600}
                priority
                className="product-detail-image"
              />
            ) : (
              <div className="product-detail-image-placeholder">
                Product image unavailable
              </div>
            )}
          </div>

          <div className="product-detail-information">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Live product intelligence
            </div>

            <h1>
              {product.name.replace(" Booster Box", "")}{" "}
              <span className="gradient-text">
                {productTypeData?.name ?? "Sealed Product"}
              </span>
            </h1>

            <p className="product-detail-meta">
              {seriesData?.name ?? "Unknown Series"} ·{" "}
              {languageData?.name ?? "Unknown Language"}
            </p>

            <div className="products-market-summary product-market-panel">
              <div>
                <span>Market price</span>
                <strong>
                  {marketPrice === null
                    ? "N/A"
                    : marketPrice.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      })}
                </strong>
              </div>

              <div>
                <span>30-day movement</span>
                <strong
                  className={
                    change30d !== null && change30d < 0
                      ? "negative"
                      : "positive"
                  }
                >
                  {change30d === null
                    ? "N/A"
                    : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className="positive">Tracked</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-overview-section">
        <div className="container">
          <div className="product-overview-panel">
            <span className="section-kicker">
              Product overview
            </span>

            <p>
              {setData?.overview ??
                "Product overview is not available yet."}
            </p>
          </div>
        </div>
      </section>

     <section className="product-statistics-section">
      <div className="container">
        <MarketStatistics
          statistics={marketStatistics}
        />
      </div>
    </section>

    <section className="product-intelligence-section">
      <div className="container">
        <div className="product-section-heading">
          <span className="section-kicker">
            TCGMVP Intelligence
          </span>

          <h2>Market Intelligence</h2>

          <p>
            Proprietary product intelligence generated from
            market direction, valuation, liquidity, pricing
            stability, and risk.
          </p>
        </div>

        <MarketRating
          rating={marketRating}
        />

        <div className="product-price-target-wrapper">

          <MarketConfidence
            confidence={sharedConfidence}
          />           
          <PriceTarget
            priceTarget={priceTarget}
          />
        </div>
        <div className="product-investment-outlook-wrapper">

          <InvestmentOutlook
            outlook={investmentOutlook}
          />
        </div>
        <div className="product-intelligence-supporting">

          <TrendAnalysis
            analysis={trendAnalysis}
          />

          <RiskAnalysis
            analysis={riskAnalysis}
          />
        </div>
      </div>
    </section>

    <section className="product-analytics-section">
      <div className="container">
        <div className="product-section-heading">
          <span className="section-kicker">
            TCGMVP Analytics
          </span>

          <h2>Supporting Analytics</h2>

          <p>
            Explore the underlying market-quality, valuation,
            and investment metrics used to support the overall
            Market Rating.
          </p>
        </div>

        <ProductAnalyticsTabs
          marketHealth={marketHealth}
          dealScore={dealScore}
          investmentGrade={investmentGrade}
        />
      </div>
    </section>

    <section className="product-market-data-section">
      <div className="container">
        <div className="product-section-heading">
          <span className="section-kicker">
            Market Data
          </span>

          <h2>Market Evidence</h2>

          <p>
            Review the tracked price history, recent completed
            sales, and current active listings behind the
            analysis.
          </p>
        </div>
      </div>

      <ProductTabs
        priceHistory={priceHistory}
        sales={marketSales}
        listings={marketListings}
      />
    </section>
    </main>
  );
}