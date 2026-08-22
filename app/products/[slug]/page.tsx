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

import {
  calculateMarketStatistics,
} from "@/lib/analytics/marketStatistics";

import TrendAnalysis from "@/components/product/TrendAnalysis";

import {
  calculateTrendAnalysis,
} from "@/lib/analytics/trendAnalysis";

import RiskAnalysis from "@/components/product/RiskAnalysis";

import {
  calculateRiskAnalysis,
} from "@/lib/analytics/riskAnalysis";

import MarketRating from "@/components/product/MarketRating";

import {
  calculateMarketRating,
} from "@/lib/analytics/marketRating";

import {
  calculatePriceTarget,
} from "@/lib/analytics/priceTarget";

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

import {
  supabase,
} from "@/lib/supabase";

import {
  calculateMarketData,
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
  shipping_price: number | string | null;
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
  shipping_price: number | string | null;
  total_price: number | string | null;
  listing_type: string | null;
  seller_name: string | null;
  seller_feedback: number | string | null;
  listing_url: string | null;
  listed_at: string | null;
  last_seen: string | null;
};


function formatCurrency(
  value: number | null,
) {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  );
}


function formatPercent(
  value: number | null,
) {
  if (value === null) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2,
  )}%`;
}


/*
|--------------------------------------------------------------------------
| Market-data freshness
|--------------------------------------------------------------------------
*/

function calculateDataAgeDays(
  timestamps: Array<
    string | null | undefined
  >,
): number | undefined {
  const validTimestamps =
    timestamps
      .map((value) => {
        if (!value) {
          return null;
        }

        const timestamp =
          new Date(
            value,
          ).getTime();

        return Number.isFinite(
          timestamp,
        )
          ? timestamp
          : null;
      })
      .filter(
        (
          timestamp,
        ): timestamp is number =>
          timestamp !== null,
      );


  if (
    validTimestamps.length === 0
  ) {
    return undefined;
  }


  const latestTimestamp =
    Math.max(
      ...validTimestamps,
    );


  const ageMilliseconds =
    Date.now() -
    latestTimestamp;


  const ageDays =
    Math.floor(
      ageMilliseconds /
      (
        24 *
        60 *
        60 *
        1000
      ),
    );


  return Math.max(
    0,
    ageDays,
  );
}


export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const {
    slug,
  } = await params;


  /*
  |--------------------------------------------------------------------------
  | Product + canonical market summary + TCGPlayer history
  |--------------------------------------------------------------------------
  */

  const {
    data: product,
    error,
  } = await supabase
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
        change_30d_percent,
        active_listings,
        lowest_listing_price,
        calculated_at
      )
    `)
    .eq(
      "slug",
      slug,
    )
    .eq(
      "active",
      true,
    )
    .single();


  if (
    error ||
    !product
  ) {
    notFound();
  }


  /*
  |--------------------------------------------------------------------------
  | Evidence UI — recent sales
  |--------------------------------------------------------------------------
  */

  const {
    data: salesData,
    error: salesError,
  } = await supabase
    .from(
      "market_sales",
    )
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
    .eq(
      "product_id",
      product.id,
    )
    .order(
      "sold_at",
      {
        ascending: false,
      },
    )
    .limit(
      10,
    );


  if (salesError) {
    console.error(
      "Unable to load market sales:",
      salesError.message,
    );
  }


  const marketSales =
    (
      salesData ??
      []
    ) as MarketSale[];


  /*
  |--------------------------------------------------------------------------
  | Analytical sold evidence
  |--------------------------------------------------------------------------
  */

  const thirtyDaysAgo =
    new Date(
      Date.now() -
      30 *
      24 *
      60 *
      60 *
      1000,
    ).toISOString();


  const {
    data: verifiedSalesData,
    error: verifiedSalesError,
  } = await supabase
    .from(
      "market_sales",
    )
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
    .eq(
      "product_id",
      product.id,
    )
    .eq(
      "marketplace",
      "ebay",
    )
    .eq(
      "data_source",
      "soldcomps",
    )
    .eq(
      "is_verified",
      true,
    )
    .gte(
      "sold_at",
      thirtyDaysAgo,
    )
    .order(
      "sold_at",
      {
        ascending: false,
      },
    );


  if (
    verifiedSalesError
  ) {
    console.error(
      "Unable to load verified market sales:",
      verifiedSalesError.message,
    );
  }


  const verifiedMarketSales =
    (
      verifiedSalesData ??
      []
    ) as MarketSale[];


  const verifiedSalePrices =
    verifiedMarketSales
      .map(
        (sale) =>
          Number(
            sale.sale_price,
          ),
      )
      .filter(
        (price) =>
          Number.isFinite(
            price,
          ) &&
          price > 0,
      );


  /*
  |--------------------------------------------------------------------------
  | Active eBay evidence UI
  |--------------------------------------------------------------------------
  |
  | Evidence shown on the product page must come
  | from the same latest successful collection
  | snapshot used by listing_statistics.py.
  |
  | Older rows remain stored as historical/raw
  | evidence but are not presented as current
  | active listings.
  |
  */

  const {
    data: latestListingSnapshotData,
    error: latestListingSnapshotError,
  } = await supabase
    .from(
      "market_listings",
    )
    .select(
      "last_seen",
    )
    .eq(
      "product_id",
      product.id,
    )
    .eq(
      "marketplace",
      "ebay",
    )
    .order(
      "last_seen",
      {
        ascending: false,
      },
    )
    .limit(
      1,
    );


  if (
    latestListingSnapshotError
  ) {
    console.error(
      "Unable to identify latest eBay listing snapshot:",
      latestListingSnapshotError.message,
    );
  }


  const latestListingSeen =
    latestListingSnapshotData?.[0]
      ?.last_seen ??
    null;


  let marketListings:
    MarketListing[] = [];


  if (
    latestListingSeen !== null
  ) {
    const {
      data: listingsData,
      error: listingsError,
    } = await supabase
      .from(
        "market_listings",
      )
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
      .eq(
        "product_id",
        product.id,
      )
      .eq(
        "marketplace",
        "ebay",
      )
      .eq(
        "last_seen",
        latestListingSeen,
      )
      .order(
        "total_price",
        {
          ascending: true,
        },
      )
      .limit(
        10,
      );


    if (
      listingsError
    ) {
      console.error(
        "Unable to load current eBay market listings:",
        listingsError.message,
      );
    }


    marketListings =
      (
        listingsData ??
        []
      ) as MarketListing[];
  }


  const listingPrices =
    marketListings
      .map(
        (listing) => {
          if (
            listing.total_price !==
            null
          ) {
            return Number(
              listing.total_price,
            );
          }


          if (
            listing.shipping_price !==
            null
          ) {
            return (
              Number(
                listing.listing_price,
              ) +
              Number(
                listing.shipping_price,
              )
            );
          }


          return null;
        },
      )
      .filter(
        (
          price,
        ): price is number =>
          price !== null &&
          Number.isFinite(
            price,
          ) &&
          price > 0,
      );


  /*
  |--------------------------------------------------------------------------
  | Product metadata
  |--------------------------------------------------------------------------
  */

  const setData =
    Array.isArray(
      product.sets,
    )
      ? product.sets[0]
      : product.sets;


  const seriesData =
    Array.isArray(
      setData?.series,
    )
      ? setData.series[0]
      : setData?.series;


  const languageData =
    Array.isArray(
      product.languages,
    )
      ? product.languages[0]
      : product.languages;


  const productTypeData =
    Array.isArray(
      product.product_types,
    )
      ? product.product_types[0]
      : product.product_types;


  /*
  |--------------------------------------------------------------------------
  | TCGPlayer / TCGCSV historical evidence
  |--------------------------------------------------------------------------
  */

  const priceHistory =
    Array.isArray(
      product.daily_market_metrics,
    )
      ? product.daily_market_metrics
          .filter(
            (item) =>
              item.marketplace_id ===
                2 &&
              item.market_price !==
                null,
          )
          .map(
            (item) => ({
              price:
                Number(
                  item.market_price,
                ),

              recorded_at:
                item.metric_date,
            }),
          )
          .filter(
            (item) =>
              Number.isFinite(
                item.price,
              ) &&
              item.price > 0,
          )
          .sort(
            (
              a,
              b,
            ) =>
              new Date(
                a.recorded_at,
              ).getTime() -
              new Date(
                b.recorded_at,
              ).getTime(),
          )
      : [];


  const historicalMarketData =
    calculateMarketData(
      priceHistory,
    );


  const marketSummary =
    Array.isArray(
      product.product_market_summary,
    )
      ? product
          .product_market_summary[0]
      : product
          .product_market_summary;


  /*
  |--------------------------------------------------------------------------
  | Canonical reference market price
  |--------------------------------------------------------------------------
  */

  const marketPrice =
    marketSummary
      ?.current_market_price !==
        null &&
    marketSummary
      ?.current_market_price !==
        undefined
      ? Number(
          marketSummary
            .current_market_price,
        )
      : historicalMarketData
          .marketPrice;


  const change30d =
    marketSummary
      ?.change_30d_percent !==
        null &&
    marketSummary
      ?.change_30d_percent !==
        undefined
      ? Number(
          marketSummary
            .change_30d_percent,
        )
      : historicalMarketData
          .change30d;


  /*
  |--------------------------------------------------------------------------
  | Canonical active market depth
  |--------------------------------------------------------------------------
  */

  const activeListings =
    marketSummary
      ?.active_listings !==
        null &&
    marketSummary
      ?.active_listings !==
        undefined
      ? Number(
          marketSummary
            .active_listings,
        )
      : marketListings.length;


  /*
  |--------------------------------------------------------------------------
  | Canonical actionable entry price
  |--------------------------------------------------------------------------
  */

  const summaryLowestListing =
    marketSummary
      ?.lowest_listing_price;


  const parsedSummaryLowestListing =
    summaryLowestListing !==
      null &&
    summaryLowestListing !==
      undefined
      ? Number(
          summaryLowestListing,
        )
      : null;


  const lowestListingPrice =
    parsedSummaryLowestListing !==
      null &&
    Number.isFinite(
      parsedSummaryLowestListing,
    ) &&
    parsedSummaryLowestListing > 0
      ? parsedSummaryLowestListing
      : listingPrices.length > 0
        ? Math.min(
            ...listingPrices,
          )
        : null;


  /*
  |--------------------------------------------------------------------------
  | Shared data freshness
  |--------------------------------------------------------------------------
  */

  const latestPriceHistoryDate =
    priceHistory.length > 0
      ? priceHistory[
          priceHistory.length -
          1
        ].recorded_at
      : null;


  const dataAgeDays =
    calculateDataAgeDays([
      marketSummary
        ?.calculated_at,

      latestPriceHistoryDate,

      ...marketListings.map(
        (listing) =>
          listing.last_seen,
      ),
    ]);


  /*
  |--------------------------------------------------------------------------
  | FAIR VALUE
  |--------------------------------------------------------------------------
  */

  const fairValue =
    calculateFairValue({
      sales:
        verifiedSalePrices,

      referencePrice:
        marketPrice,
    });


  /*
  |--------------------------------------------------------------------------
  | MARKET HEALTH
  |--------------------------------------------------------------------------
  */

  const marketHealth =
    calculateMarketHealth({
      sales:
        verifiedSalePrices,

      listings:
        listingPrices,

      activeListingsCount:
        activeListings,
    });


  /*
  |--------------------------------------------------------------------------
  | DEAL SCORE
  |--------------------------------------------------------------------------
  |
  | Valuation-only:
  | actionable entry price vs Fair Value.
  |
  */

  const dealScore =
    fairValue.fairValue !==
      null &&
    lowestListingPrice !==
      null
      ? calculateDealScore({
          fairMarketValue:
            fairValue.fairValue,

          listingPrice:
            lowestListingPrice,
        })
      : null;


  const dealScoreValue =
    dealScore?.score ??
    50;


  /*
  |--------------------------------------------------------------------------
  | INVESTMENT GRADE
  |--------------------------------------------------------------------------
  */

  const investmentGrade =
    calculateInvestmentGrade({
      marketHealthScore:
        marketHealth.score,

      dealScore:
        dealScoreValue,
    });


  /*
  |--------------------------------------------------------------------------
  | MARKET STATISTICS
  |--------------------------------------------------------------------------
  */

  const marketStatistics =
    calculateMarketStatistics(
      priceHistory,
      verifiedMarketSales,
    );


  /*
  |--------------------------------------------------------------------------
  | SHARED MARKET CONFIDENCE
  |--------------------------------------------------------------------------
  */

  const sharedConfidence =
    calculateConfidence({
      recentSalesCount:
        verifiedSalePrices.length,

      activeListingsCount:
        activeListings,

      priceHistoryPoints:
        priceHistory.length,

      hasCurrentPrice:
        marketPrice !== null,

      hasFairValue:
        fairValue.fairValue !==
        null,

      dataAgeDays,
    });


  /*
  |--------------------------------------------------------------------------
  | TREND ANALYSIS
  |--------------------------------------------------------------------------
  */

  const trendAnalysis =
    calculateTrendAnalysis(
      marketStatistics,
      sharedConfidence,
    );


  /*
  |--------------------------------------------------------------------------
  | RISK ANALYSIS
  |--------------------------------------------------------------------------
  */

  const riskAnalysis =
    calculateRiskAnalysis({
      statistics:
        marketStatistics,

      trendAnalysis,

      marketConfidence:
        sharedConfidence,

      fairValue:
        fairValue.fairValue,

      entryPrice:
        lowestListingPrice,

      activeListingsCount:
        activeListings,
    });


  /*
  |--------------------------------------------------------------------------
  | PRICE TARGET
  |--------------------------------------------------------------------------
  */

  const priceTarget =
    calculatePriceTarget({
      referencePrice:
        marketPrice,

      entryPrice:
        lowestListingPrice,

      fairValue:
        fairValue.fairValue,

      trendScore:
        trendAnalysis.strength,

      riskScore:
        riskAnalysis.riskScore,

      marketConfidenceScore:
        sharedConfidence.score,

      marketConfidence:
        sharedConfidence.confidence,
    });


  /*
  |--------------------------------------------------------------------------
  | MARKET RATING
  |--------------------------------------------------------------------------
  */

  const marketRating =
    calculateMarketRating({
      entryPrice:
        lowestListingPrice,

      trendAnalysis,

      riskAnalysis,

      fairValue,

      marketHealth,

      marketConfidenceScore:
        sharedConfidence.score,

      marketConfidence:
        sharedConfidence.confidence,
    });


  /*
  |--------------------------------------------------------------------------
  | INVESTMENT OUTLOOK
  |--------------------------------------------------------------------------
  */

  const investmentOutlook =
    calculateInvestmentOutlook({
      referencePrice:
        marketPrice,

      entryPrice:
        lowestListingPrice,

      fairValue:
        fairValue.fairValue,

      marketRatingScore:
        marketRating.ratingScore,

      trendScore:
        trendAnalysis.strength,

      riskScore:
        riskAnalysis.riskScore,

      marketHealthScore:
        marketHealth.score,

      expectedReturnPercent:
        priceTarget
          .potentialUpsidePercent,

      recentSalesCount:
        verifiedSalePrices.length,

      activeListingsCount:
        activeListings,

      marketConfidenceScore:
        sharedConfidence.score,

      marketConfidence:
        sharedConfidence.confidence,

      change30d:
        marketStatistics.change30d,
    });


  /*
  |--------------------------------------------------------------------------
  | TEMPORARY ANALYTICS VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      "\n==================================================",
    );

    console.log(
      `TCGMVP ANALYTICS DEBUG — ${product.name}`,
    );

    console.log(
      "==================================================",
    );

    console.log({
      product: {
        id:
          product.id,

        name:
          product.name,
      },

      pricing: {
        referenceMarketPrice:
          marketPrice,

        actionableEntryPrice:
          lowestListingPrice,

        change30d,

        fairValue:
          fairValue.fairValue,

        fairValueMethodology:
          fairValue.methodology,

        priceTarget:
          priceTarget.targetPrice,

        potentialUpsidePercent:
          priceTarget
            .potentialUpsidePercent,

        marginOfSafetyPercent:
          priceTarget
            .marginOfSafetyPercent,

        downsideRiskPercent:
          priceTarget
            .downsideRiskPercent,
      },

      evidence: {
        verifiedSalesCount:
          verifiedSalePrices.length,

        verifiedSalePrices,

        activeListingsCount:
          activeListings,

        displayedListingCount:
          marketListings.length,

        deliveredListingPrices:
          listingPrices,

        priceHistoryPoints:
          priceHistory.length,

        dataAgeDays,
      },

      fairValue: {
        fairValue:
          fairValue.fairValue,

        medianSale:
          fairValue.medianSale,

        averageSale:
          fairValue.averageSale,

        lowestSale:
          fairValue.lowestSale,

        highestSale:
          fairValue.highestSale,

        salesCount:
          fairValue.salesCount,

        methodology:
          fairValue.methodology,
      },

      marketHealth: {
        score:
          marketHealth.score,

        label:
          marketHealth.label,

        liquidityScore:
          marketHealth
            .liquidityScore,

        supplyBalanceScore:
          marketHealth
            .supplyBalanceScore,

        priceStabilityScore:
          marketHealth
            .priceStabilityScore,

        priceVariationPercent:
          marketHealth
            .priceVariationPercent,
      },

      dealScore:
        dealScore
          ? {
              score:
                dealScore.score,

              label:
                dealScore.label,

              discountPercent:
                dealScore
                  .discountPercent,

              priceScore:
                dealScore
                  .priceScore,
            }
          : null,

      investmentGrade: {
        score:
          investmentGrade.score,

        grade:
          investmentGrade.grade,

        label:
          investmentGrade.label,

        marketQualityScore:
          investmentGrade
            .marketQualityScore,

        opportunityScore:
          investmentGrade
            .opportunityScore,
      },

      confidence: {
        score:
          sharedConfidence.score,

        confidence:
          sharedConfidence
            .confidence,

        reasons:
          sharedConfidence
            .reasons,
      },

      trend: {
        trend:
          trendAnalysis.trend,

        momentum:
          trendAnalysis.momentum,

        strength:
          trendAnalysis.strength,

        confidence:
          trendAnalysis.confidence,

        salesTracked:
          trendAnalysis.salesTracked,

        reasons:
          trendAnalysis.reasons,
      },

      risk: {
        riskScore:
          riskAnalysis.riskScore,

        overallRisk:
          riskAnalysis.overallRisk,

        volatilityRisk:
          riskAnalysis
            .volatilityRisk,

        liquidityRisk:
          riskAnalysis
            .liquidityRisk,

        valuationRisk:
          riskAnalysis
            .valuationRisk,

        dataRisk:
          riskAnalysis.dataRisk,

        reasons:
          riskAnalysis.reasons,
      },

      priceTarget: {
        referencePrice:
          priceTarget.referencePrice,

        entryPrice:
          priceTarget.entryPrice,

        fairValue:
          priceTarget.fairValue,

        targetPrice:
          priceTarget.targetPrice,

        potentialUpsidePercent:
          priceTarget
            .potentialUpsidePercent,

        marginOfSafetyPercent:
          priceTarget
            .marginOfSafetyPercent,

        downsideRiskPercent:
          priceTarget
            .downsideRiskPercent,

        targetAdjustmentPercent:
          priceTarget
            .targetAdjustmentPercent,

        verdict:
          priceTarget.verdict,

        confidence:
          priceTarget.confidence,
      },

      marketRating: {
        ratingScore:
          marketRating.ratingScore,

        rating:
          marketRating.rating,

        trendScore:
          marketRating.trendScore,

        riskAdjustedScore:
          marketRating
            .riskAdjustedScore,

        valuationScore:
          marketRating
            .valuationScore,

        marketHealthScore:
          marketRating
            .marketHealthScore,

        confidenceScore:
          marketRating
            .confidenceScore,

        confidence:
          marketRating.confidence,
      },

      investmentOutlook: {
        overallOutlook:
          investmentOutlook
            .overallOutlook,

        overallScore:
          investmentOutlook
            .overallScore,

        shortTermOutlook:
          investmentOutlook
            .shortTermOutlook,

        shortTermScore:
          investmentOutlook
            .shortTermScore,

        longTermOutlook:
          investmentOutlook
            .longTermOutlook,

        longTermScore:
          investmentOutlook
            .longTermScore,

        collectorDemand:
          investmentOutlook
            .collectorDemand,

        collectorDemandScore:
          investmentOutlook
            .collectorDemandScore,

        inventoryAbsorption:
          investmentOutlook
            .inventoryAbsorption,

        inventoryAbsorptionScore:
          investmentOutlook
            .inventoryAbsorptionScore,

        confidence:
          investmentOutlook
            .confidence,

        summary:
          investmentOutlook.summary,
      },
    });

    console.log(
      "==================================================\n",
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Product/report presentation
  |--------------------------------------------------------------------------
  */

  const overviewName =
    product.name.replace(
      " Booster Box",
      "",
    );


  const heroFairValue =
    fairValue.fairValue;


  const heroUpside =
    priceTarget
      .potentialUpsidePercent;


  const keySignal =
    investmentOutlook
      .strengths[0] ??
    marketRating
      .strengths[0] ??
    "Market conditions are balanced";


  const primaryConcern =
    investmentOutlook
      .headwinds[0] ??
    marketRating
      .concerns[0] ??
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
          <Link
            className="brand"
            href="/"
          >
            <Image
              src="/tcgmvp-mark.png"
              alt="TCGMVP"
              width={48}
              height={48}
              className="brand-logo"
              priority
            />

            <span>
              TCGMVP
            </span>
          </Link>


          <div className="nav-links">
            <Link href="/">
              Home
            </Link>

            <Link href="/products">
              Market
            </Link>

            <span>
              Portfolio
            </span>

            <span>
              Watchlist
            </span>
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


      <ProductHero
        imageUrl={
          product.image_url
        }

        productName={
          overviewName
        }

        productType={
          productTypeData?.name ??
          "Sealed Product"
        }

        seriesName={
          seriesData?.name ??
          "Unknown Series"
        }

        languageName={
          languageData?.name ??
          "Unknown Language"
        }

        marketPrice={
          formatCurrency(
            marketPrice,
          )
        }

        change30d={
          formatPercent(
            change30d,
          )
        }

        changeTone={
          changeTone
        }

        metrics={[
          {
            label:
              "Market Rating",

            value:
              `${marketRating.ratingScore}/100`,

            detail:
              marketRating.rating,

            featured:
              true,

            detailTone:
              marketRating.ratingScore >=
              70
                ? "positive"
                : marketRating.ratingScore <
                    40
                  ? "negative"
                  : "gold",
          },

          {
            label:
              "Fair Value",

            value:
              formatCurrency(
                heroFairValue,
              ),

            detail:
              heroUpside ===
              null
                ? "Upside unavailable"
                : `${heroUpside >= 0 ? "+" : ""}${heroUpside.toFixed(
                    1,
                  )}% target potential`,

            detailTone:
              heroUpside ===
              null
                ? "default"
                : heroUpside > 0
                  ? "positive"
                  : heroUpside < 0
                    ? "negative"
                    : "default",
          },

          {
            label:
              "Confidence",

            value:
              sharedConfidence
                .confidence,

            detail:
              `${sharedConfidence.score}/100 evidence score`,

            valueTone:
              sharedConfidence
                .confidence ===
              "High"
                ? "positive"
                : sharedConfidence
                      .confidence ===
                    "Medium"
                  ? "warning"
                  : sharedConfidence
                        .confidence ===
                      "Low"
                    ? "negative"
                    : "default",

            detailTone:
              "default",
          },
        ]}
      />


      <ResearchSummary
        summary={
          <MarketIntelligenceSummary
            productName={
              overviewName
            }

            rating={
              marketRating.rating
            }

            ratingScore={
              marketRating.ratingScore
            }

            outlook={
              investmentOutlook
                .overallOutlook
            }

            summary={
              investmentOutlook
                .summary ||
              marketRating.summary
            }

            keySignal={
              keySignal
            }

            primaryConcern={
              primaryConcern
            }

            confidence={
              sharedConfidence
                .confidence
            }

            confidenceScore={
              sharedConfidence
                .score
            }
          />
        }

        overview={
          setData?.overview ??
          "Product overview is not available yet."
        }
      />


      <ReportSection
        eyebrow="Investment Thesis"
        title="Market Intelligence"
        description="The platform's primary conclusion, forward outlook, valuation target, and supporting evidence confidence."
        className="product-intelligence-section product-intelligence-section-v2"
      >
        <MarketRating
          rating={
            marketRating
          }
        />


        <div className="product-investment-outlook-wrapper">
          <InvestmentOutlook
            outlook={
              investmentOutlook
            }
          />
        </div>


        <AnalyticsGrid className="product-price-target-wrapper product-price-target-wrapper-v2">
          <PriceTarget
            priceTarget={
              priceTarget
            }
          />

          <MarketConfidence
            confidence={
              sharedConfidence
            }
          />
        </AnalyticsGrid>
      </ReportSection>


      <ReportSection
        eyebrow="Market Context"
        title="Market Statistics"
        description="Price behavior and market activity used to frame the intelligence above."
        className="product-statistics-section product-statistics-section-v2 product-report-section-compact"
      >
        <MarketStatistics
          statistics={
            marketStatistics
          }
        />
      </ReportSection>


      <ReportSection
        eyebrow="Direction & Risk"
        title="Market Analysis"
        description="A focused view of current momentum, trend quality, volatility, and downside exposure."
        className="product-direction-section"
      >
        <AnalyticsGrid
          columns={1}
          className="product-intelligence-supporting"
        >
          <TrendAnalysis
            analysis={
              trendAnalysis
            }
          />

          <RiskAnalysis
            analysis={
              riskAnalysis
            }
          />
        </AnalyticsGrid>
      </ReportSection>


      <ReportSection
        eyebrow="TCGMVP Analytics"
        title="Supporting Analysis"
        description="Explore the market-quality, valuation, and investment metrics supporting the overall Market Rating."
        className="product-analytics-section"
      >
        <ProductAnalyticsTabs
          marketHealth={
            marketHealth
          }

          dealScore={
            dealScore
          }

          investmentGrade={
            investmentGrade
          }
        />
      </ReportSection>


      <EvidenceSection>
        <ProductTabs
          priceHistory={
            priceHistory
          }

          sales={
            marketSales
          }

          listings={
            marketListings
          }
        />
      </EvidenceSection>
    </main>
  );
}