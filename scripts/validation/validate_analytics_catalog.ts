import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

import {
  calculateFairValue,
} from "@/lib/analytics/fairValue";

import {
  calculateMarketHealth,
} from "@/lib/analytics/marketHealth";

import {
  calculateDealScore,
} from "@/lib/analytics/dealScore";

import {
  calculateInvestmentGrade,
} from "@/lib/analytics/investmentGrade";

import {
  calculateMarketStatistics,
} from "@/lib/analytics/marketStatistics";

import {
  calculateConfidence,
} from "@/lib/analytics/confidence";

import {
  calculateCrossSourceAgreement,
} from "@/lib/analytics/crossSourceAgreement";

import {
  calculateSourceRecency,
} from "@/lib/analytics/sourceRecency";

import {
  calculateSourceEvidenceQuality,
} from "@/lib/analytics/sourceEvidenceQuality";

import {
  calculateMarketAnomalyDetection,
} from "@/lib/analytics/marketAnomalyDetection";

import {
  calculateTrendAnalysis,
} from "@/lib/analytics/trendAnalysis";

import {
  calculateRiskAnalysis,
} from "@/lib/analytics/riskAnalysis";

import {
  calculatePriceTarget,
} from "@/lib/analytics/priceTarget";

import {
  calculateMarketRating,
} from "@/lib/analytics/marketRating";

import {
  calculateInvestmentOutlook,
} from "@/lib/analytics/investmentOutlook";

import {
  calculateMarketData,
} from "@/lib/analytics/marketData";


loadEnvConfig(
  process.cwd(),
);


const supabaseUrl =
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;


const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is missing.",
  );
}


if (!supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing.",
  );
}


const supabase =
  createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );


type ValidationSeverity =
  | "PASS"
  | "WARN"
  | "FAIL";


type ValidationFinding = {
  severity:
    ValidationSeverity;

  check:
    string;

  message:
    string;
};


type ProductValidationResult = {
  productId:
    number;

  productName:
    string;

  productSlug:
    string;

  findings:
    ValidationFinding[];

  snapshot: {
    marketPrice:
      number | null;

    entryPrice:
      number | null;

    fairValue:
      number | null;

    verifiedSales:
      number;

    activeListings:
      number;

    historyPoints:
      number;

    crossSourceScore:
      number | null;

    crossSourceAgreement:
      string;

    crossSourceSignals:
      number;

    crossSourceComparisons:
      number;

    realizedSalesDiagnosis:
      string;

    realizedSalesReason:
      string;

    sourceRecencyScore:
      number | null;

    sourceRecencyLabel:
      string;

    evidenceQualityScore:
      number;

    evidenceQualityLabel:
      string;

    salesDepthScore:
      number;

    listingDepthScore:
      number;

    historyDepthScore:
      number;

    crossSourceDepthScore:
      number;

    anomalyScore:
      number;

    anomalyLevel:
      string;

    anomalyFlags:
      string[];

    saleOutlierCount:
      number;

    listingOutlierCount:
      number;

    saleDispersionPercent:
      number | null;

    listingSpreadPercent:
      number | null;

    lowestListingDiscountPercent:
      number | null;

    referenceAgeDays:
      number | null;

    soldAgeDays:
      number | null;

    activeAgeDays:
      number | null;

    soldMedianPrice:
      number | null;

    activeMedianPrice:
      number | null;

    confidenceScore:
      number;

    confidence:
      string;

    trendScore:
      number;

    trend:
      string;

    riskScore:
      number;

    risk:
      string;

    marketRatingScore:
      number;

    marketRating:
      string;

    priceTarget:
      number | null;

    priceTargetVerdict:
      string;

    outlookScore:
      number;

    outlook:
      string;
  };
};


type MarketSale = {
  total_price:
    number | string | null;

  sale_price:
    number | string;

  shipping_price:
    number | string | null;

  sold_at:
    string;

  is_verified:
    boolean;
};


type ListingRow = {
  listing_price:
    number | string;

  shipping_price:
    number | string | null;

  total_price:
    number | string | null;

  last_seen:
    string | null;
};


type HistoryRow = {
  metric_date:
    string;

  market_price:
    number | string | null;

  marketplace_id:
    number;
};


type EbayMetricRow = {
  metric_date:
    string;

  median_listing_price:
    number | string | null;
};


type SummaryRow = {
  current_market_price:
    number | string | null;

  change_30d_percent:
    number | string | null;

  active_listings:
    number | null;

  lowest_listing_price:
    number | string | null;

  calculated_at:
    string | null;
};


function printHeader(
  title: string,
): void {
  console.log("");

  console.log(
    "=".repeat(
      78,
    ),
  );

  console.log(
    title,
  );

  console.log(
    "=".repeat(
      78,
    ),
  );
}


function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  );
}


function addFinding(
  findings:
    ValidationFinding[],

  severity:
    ValidationSeverity,

  check:
    string,

  message:
    string,
): void {
  findings.push({
    severity,
    check,
    message,
  });
}


function checkScore(
  findings:
    ValidationFinding[],

  check:
    string,

  value:
    number | null,

  minimum = 0,
  maximum = 100,
  allowNull = false,
): void {
  if (
    value === null
  ) {
    if (allowNull) {
      addFinding(
        findings,
        "PASS",
        check,
        "Unavailable as expected.",
      );

      return;
    }


    addFinding(
      findings,
      "FAIL",
      check,
      "Unexpected null score.",
    );

    return;
  }


  if (
    !isFiniteNumber(
      value,
    )
  ) {
    addFinding(
      findings,
      "FAIL",
      check,
      `Non-finite value: ${String(
        value,
      )}`,
    );

    return;
  }


  if (
    value < minimum ||
    value > maximum
  ) {
    addFinding(
      findings,
      "FAIL",
      check,
      `Out of bounds: ${value}. Expected ${minimum}–${maximum}.`,
    );

    return;
  }


  addFinding(
    findings,
    "PASS",
    check,
    `${value} is within ${minimum}–${maximum}.`,
  );
}


function calculateDataAgeDays(
  timestamps: Array<
    string | null | undefined
  >,
): number | undefined {
  const valid =
    timestamps
      .map(
        (
          value,
        ) => {
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
        },
      )
      .filter(
        (
          value,
        ): value is number =>
          value !== null,
      );


  if (
    valid.length === 0
  ) {
    return undefined;
  }


  const latest =
    Math.max(
      ...valid,
    );


  const age =
    Math.floor(
      (
        Date.now() -
        latest
      ) /
      (
        24 *
        60 *
        60 *
        1000
      ),
    );


  return Math.max(
    0,
    age,
  );
}


function expectedTrendLabel(
  score: number,
): string {
  if (score >= 80) {
    return "Very Bullish";
  }

  if (score >= 65) {
    return "Bullish";
  }

  if (score >= 45) {
    return "Neutral";
  }

  if (score >= 25) {
    return "Bearish";
  }

  return "Very Bearish";
}


function expectedRiskLabel(
  score: number,
): string {
  if (score <= 20) {
    return "Very Low";
  }

  if (score <= 40) {
    return "Low";
  }

  if (score <= 60) {
    return "Moderate";
  }

  if (score <= 80) {
    return "High";
  }

  return "Very High";
}


function expectedMarketRatingLabel(
  score: number,
): string {
  if (score >= 90) {
    return "Exceptional";
  }

  if (score >= 80) {
    return "Strong";
  }

  if (score >= 68) {
    return "Favorable";
  }

  if (score >= 52) {
    return "Neutral";
  }

  if (score >= 35) {
    return "Weak";
  }

  return "Very Weak";
}


function expectedOutlookLabel(
  score: number,
): string {
  if (score >= 80) {
    return "Very Bullish";
  }

  if (score >= 65) {
    return "Bullish";
  }

  if (score >= 45) {
    return "Neutral";
  }

  if (score >= 30) {
    return "Bearish";
  }

  return "Very Bearish";
}


async function getProducts() {
  const {
    data,
    error,
  } = await supabase
    .from(
      "products",
    )
    .select(
      "id,name,slug",
    )
    .eq(
      "active",
      true,
    )
    .eq(
      "active_for_import",
      true,
    )
    .order(
      "id",
      {
        ascending: true,
      },
    );


  if (error) {
    throw new Error(
      `Unable to load products: ${error.message}`,
    );
  }


  return data ?? [];
}


async function getMarketSummary(
  productId: number,
): Promise<
  SummaryRow | null
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "product_market_summary",
    )
    .select(`
      current_market_price,
      change_30d_percent,
      active_listings,
      lowest_listing_price,
      calculated_at
    `)
    .eq(
      "product_id",
      productId,
    )
    .maybeSingle();


  if (error) {
    throw new Error(
      `Unable to load market summary: ${error.message}`,
    );
  }


  return (
    data as SummaryRow | null
  );
}


async function getPriceHistory(
  productId: number,
): Promise<
  HistoryRow[]
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "daily_market_metrics",
    )
    .select(`
      metric_date,
      market_price,
      marketplace_id
    `)
    .eq(
      "product_id",
      productId,
    )
    .eq(
      "marketplace_id",
      2,
    )
    .not(
      "market_price",
      "is",
      null,
    )
    .order(
      "metric_date",
      {
        ascending: true,
      },
    );


  if (error) {
    throw new Error(
      `Unable to load price history: ${error.message}`,
    );
  }


  return (
    data ?? []
  ) as HistoryRow[];
}


async function getLatestEbayMetric(
  productId: number,
): Promise<
  EbayMetricRow | null
> {
  const {
    data,
    error,
  } = await supabase
    .from(
      "daily_market_metrics",
    )
    .select(`
      metric_date,
      median_listing_price
    `)
    .eq(
      "product_id",
      productId,
    )
    .eq(
      "marketplace_id",
      1,
    )
    .not(
      "median_listing_price",
      "is",
      null,
    )
    .order(
      "metric_date",
      {
        ascending: false,
      },
    )
    .limit(
      1,
    );


  if (error) {
    throw new Error(
      `Unable to load latest eBay metric: ${error.message}`,
    );
  }


  return (
    data?.[0] ??
    null
  ) as EbayMetricRow | null;
}


async function getVerifiedSales(
  productId: number,
): Promise<
  MarketSale[]
> {
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
    data,
    error,
  } = await supabase
    .from(
      "market_sales",
    )
    .select(`
      total_price,
      sale_price,
      shipping_price,
      sold_at,
      is_verified
    `)
    .eq(
      "product_id",
      productId,
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


  if (error) {
    throw new Error(
      `Unable to load verified sales: ${error.message}`,
    );
  }


  return (
    data ?? []
  ) as MarketSale[];
}


async function getCurrentListings(
  productId: number,
): Promise<
  ListingRow[]
> {
  const {
    data: latestData,
    error: latestError,
  } = await supabase
    .from(
      "market_listings",
    )
    .select(
      "last_seen",
    )
    .eq(
      "product_id",
      productId,
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


  if (latestError) {
    throw new Error(
      `Unable to identify latest listing snapshot: ${latestError.message}`,
    );
  }


  const latestSeen =
    latestData?.[0]
      ?.last_seen ??
    null;


  if (
    latestSeen === null
  ) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from(
      "market_listings",
    )
    .select(`
      listing_price,
      shipping_price,
      total_price,
      last_seen
    `)
    .eq(
      "product_id",
      productId,
    )
    .eq(
      "marketplace",
      "ebay",
    )
    .eq(
      "last_seen",
      latestSeen,
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


  if (error) {
    throw new Error(
      `Unable to load current listings: ${error.message}`,
    );
  }


  return (
    data ?? []
  ) as ListingRow[];
}


async function getCurrentListingsForAnalytics(
  productId: number,
): Promise<
  ListingRow[]
> {
  const {
    data: latestData,
    error: latestError,
  } = await supabase
    .from(
      "market_listings",
    )
    .select(
      "last_seen",
    )
    .eq(
      "product_id",
      productId,
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


  if (latestError) {
    throw new Error(
      `Unable to identify latest analytics listing snapshot: ${latestError.message}`,
    );
  }


  const latestSeen =
    latestData?.[0]
      ?.last_seen ??
    null;


  if (
    latestSeen === null
  ) {
    return [];
  }


  const {
    data,
    error,
  } = await supabase
    .from(
      "market_listings",
    )
    .select(`
      listing_price,
      shipping_price,
      total_price,
      last_seen
    `)
    .eq(
      "product_id",
      productId,
    )
    .eq(
      "marketplace",
      "ebay",
    )
    .eq(
      "last_seen",
      latestSeen,
    )
    .order(
      "total_price",
      {
        ascending: true,
      },
    );


  if (error) {
    throw new Error(
      `Unable to load analytics listing snapshot: ${error.message}`,
    );
  }


  return (
    data ?? []
  ) as ListingRow[];
}


async function validateProduct(
  product: {
    id: number;
    name: string;
    slug: string;
  },
): Promise<
  ProductValidationResult
> {
  const findings:
    ValidationFinding[] =
    [];


  const [
    marketSummary,
    rawHistory,
    verifiedSales,
    listings,
    analyticsListings,
    latestEbayMetric,
  ] =
    await Promise.all([
      getMarketSummary(
        product.id,
      ),

      getPriceHistory(
        product.id,
      ),

      getVerifiedSales(
        product.id,
      ),

      getCurrentListings(
        product.id,
      ),

      getCurrentListingsForAnalytics(
        product.id,
      ),

      getLatestEbayMetric(
        product.id,
      ),
    ]);


  const priceHistory =
    rawHistory
      .map(
        (
          item,
        ) => ({
          price:
            Number(
              item.market_price,
            ),

          recorded_at:
            item.metric_date,
        }),
      )
      .filter(
        (
          item,
        ) =>
          Number.isFinite(
            item.price,
          ) &&
          item.price > 0,
      );


  const historicalMarketData =
    calculateMarketData(
      priceHistory,
    );


  const summaryMarketPrice =
    marketSummary
      ?.current_market_price;


  const parsedMarketPrice =
    summaryMarketPrice !==
      null &&
    summaryMarketPrice !==
      undefined
      ? Number(
          summaryMarketPrice,
        )
      : null;


  const marketPrice =
    parsedMarketPrice !==
      null &&
    Number.isFinite(
      parsedMarketPrice,
    ) &&
    parsedMarketPrice > 0
      ? parsedMarketPrice
      : historicalMarketData
          .marketPrice;


  const summaryActiveListings =
    marketSummary
      ?.active_listings;


  const activeListings =
    summaryActiveListings !==
      null &&
    summaryActiveListings !==
      undefined &&
    Number.isFinite(
      Number(
        summaryActiveListings,
      ),
    )
      ? Math.max(
          0,
          Math.floor(
            Number(
              summaryActiveListings,
            ),
          ),
        )
      : analyticsListings.length;


  const listingPrices =
    listings
      .map(
        (
          listing,
        ) => {
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


          return Number(
            listing.listing_price,
          );
        },
      )
      .filter(
        (
          value,
        ): value is number =>
          Number.isFinite(
            value,
          ) &&
          value > 0,
      );


  const analyticsListingPrices =
    analyticsListings
      .map(
        (
          listing,
        ) => {
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


          return Number(
            listing.listing_price,
          );
        },
      )
      .filter(
        (
          value,
        ): value is number =>
          Number.isFinite(
            value,
          ) &&
          value > 0,
      );


  const summaryEntry =
    marketSummary
      ?.lowest_listing_price;


  const parsedEntry =
    summaryEntry !==
      null &&
    summaryEntry !==
      undefined
      ? Number(
          summaryEntry,
        )
      : null;


  const entryPrice =
    parsedEntry !==
      null &&
    Number.isFinite(
      parsedEntry,
    ) &&
    parsedEntry > 0
      ? parsedEntry
      : listingPrices.length > 0
        ? Math.min(
            ...listingPrices,
          )
        : null;


  const parsedEbayMedianListing =
    latestEbayMetric
      ?.median_listing_price !==
        null &&
    latestEbayMetric
      ?.median_listing_price !==
        undefined
      ? Number(
          latestEbayMetric
            .median_listing_price,
        )
      : null;


  const ebayMedianListingPrice =
    parsedEbayMedianListing !==
      null &&
    Number.isFinite(
      parsedEbayMedianListing,
    ) &&
    parsedEbayMedianListing > 0
      ? parsedEbayMedianListing
      : null;


  const verifiedSalePrices =
    verifiedSales
      .map(
        (
          sale,
        ) =>
          Number(
            sale.sale_price,
          ),
      )
      .filter(
        (
          value,
        ) =>
          Number.isFinite(
            value,
          ) &&
          value > 0,
      );


  const latestVerifiedSaleAt =
    verifiedSales.length > 0
      ? verifiedSales
          .map(
            (
              sale,
            ) =>
              sale.sold_at,
          )
          .filter(
            (
              value,
            ) =>
              Boolean(
                value,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              new Date(
                second,
              ).getTime() -
              new Date(
                first,
              ).getTime(),
          )[0] ??
        null
      : null;


  const latestPriceDate =
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

      latestPriceDate,

      latestEbayMetric
        ?.metric_date,

      ...analyticsListings.map(
        (
          listing,
        ) =>
          listing.last_seen,
      ),
    ]);


  const fairValue =
    calculateFairValue({
      sales:
        verifiedSalePrices,

      referencePrice:
        marketPrice,
    });


  const crossSourceAgreement =
    calculateCrossSourceAgreement({
      referencePrice:
        marketPrice,

      soldMedianPrice:
        fairValue.medianSale,

      activeMedianPrice:
        ebayMedianListingPrice,
    });


  const sourceRecency =
    calculateSourceRecency({
      referenceObservedAt:
        latestPriceDate,

      soldObservedAt:
        latestVerifiedSaleAt,

      activeObservedAt:
        latestEbayMetric
          ?.metric_date ??
        null,
    });


  const sourceEvidenceQuality =
    calculateSourceEvidenceQuality({
      verifiedSalesCount:
        verifiedSalePrices.length,

      activeListingsCount:
        activeListings,

      historyPoints:
        priceHistory.length,

      crossSourceComparisons:
        crossSourceAgreement
          .comparisonsAvailable,
    });


  const marketAnomalyDetection =
    calculateMarketAnomalyDetection({
      salePrices:
        verifiedSalePrices,

      listingPrices:
        analyticsListingPrices,
    });


  const marketHealth =
    calculateMarketHealth({
      sales:
        verifiedSalePrices,

      listings:
        listingPrices,

      activeListingsCount:
        activeListings,
    });


  const dealScore =
    fairValue.fairValue !==
      null &&
    entryPrice !==
      null
      ? calculateDealScore({
          fairMarketValue:
            fairValue.fairValue,

          listingPrice:
            entryPrice,
        })
      : null;


  const investmentGrade =
    marketHealth.score !==
      null &&
    dealScore !==
      null
      ? calculateInvestmentGrade({
          marketHealthScore:
            marketHealth.score,

          dealScore:
            dealScore.score,
        })
      : null;


  const marketStatistics =
    calculateMarketStatistics(
      priceHistory,
      verifiedSales,
    );


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

      crossSourceAgreementScore:
        crossSourceAgreement
          .score,

      crossSourceComparisons:
        crossSourceAgreement
          .comparisonsAvailable,
    });


  const trendAnalysis =
    calculateTrendAnalysis(
      marketStatistics,
      sharedConfidence,
    );


  const riskAnalysis =
    calculateRiskAnalysis({
      statistics:
        marketStatistics,

      trendAnalysis,

      marketConfidence:
        sharedConfidence,

      fairValue:
        fairValue.fairValue,

      entryPrice,

      activeListingsCount:
        activeListings,
    });


  const priceTarget =
    calculatePriceTarget({
      referencePrice:
        marketPrice,

      entryPrice,

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


  const marketRating =
    calculateMarketRating({
      entryPrice,

      trendAnalysis,

      riskAnalysis,

      fairValue,

      marketHealth,

      marketConfidenceScore:
        sharedConfidence.score,

      marketConfidence:
        sharedConfidence.confidence,
    });


  const investmentOutlook =
    calculateInvestmentOutlook({
      referencePrice:
        marketPrice,

      entryPrice,

      fairValue:
        fairValue.fairValue,

      marketRatingScore:
        marketRating.ratingScore,

      trendScore:
        trendAnalysis.strength,

      riskScore:
        riskAnalysis.riskScore,

      marketHealthScore:
        marketHealth.score ??
        0,

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
  | STRUCTURAL / NUMERIC VALIDATION
  |--------------------------------------------------------------------------
  */


  if (
    crossSourceAgreement
      .score !== null
  ) {
    checkScore(
      findings,
      "Cross-Source Agreement bounds",
      crossSourceAgreement.score,
    );
  }


  if (
    crossSourceAgreement
      .signalsAvailable < 2
  ) {
    if (
      crossSourceAgreement
        .score === null &&
      crossSourceAgreement
        .agreement ===
        "Unavailable"
    ) {
      addFinding(
        findings,
        "PASS",
        "Cross-source availability handling",
        "Fewer than two signals correctly produces unavailable agreement.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Cross-source availability handling",
        "Fewer than two signals should not produce an agreement score.",
      );
    }
  }


  if (
    crossSourceAgreement
      .signalsAvailable >= 2
  ) {
    if (
      crossSourceAgreement
        .score !== null &&
      crossSourceAgreement
        .comparisonsAvailable >
        0
    ) {
      addFinding(
        findings,
        "PASS",
        "Cross-source comparison availability",
        `${crossSourceAgreement.signalsAvailable} signals produced ${crossSourceAgreement.comparisonsAvailable} usable comparison(s).`,
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Cross-source comparison availability",
        "Two or more valid signals should produce an agreement score.",
      );
    }
  }


  if (
    sourceRecency.score !==
    null
  ) {
    checkScore(
      findings,
      "Source Recency bounds",
      sourceRecency.score,
    );
  }


  if (
    sourceRecency
      .signalsWithTimestamps ===
      0
  ) {
    if (
      sourceRecency.score ===
        null &&
      sourceRecency.label ===
        "Unavailable"
    ) {
      addFinding(
        findings,
        "PASS",
        "Source Recency availability handling",
        "No source timestamps correctly produces unavailable recency.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Source Recency availability handling",
        "No source timestamps should produce unavailable recency.",
      );
    }
  }


  checkScore(
    findings,
    "Source Evidence Quality bounds",
    sourceEvidenceQuality.score,
  );


  checkScore(
    findings,
    "Market Anomaly bounds",
    marketAnomalyDetection
      .anomalyScore,
  );


  checkScore(
    findings,
    "Confidence bounds",
    sharedConfidence.score,
    0,
    100,
  );


  checkScore(
    findings,
    "Trend score bounds",
    trendAnalysis.strength,
  );


  checkScore(
    findings,
    "Risk score bounds",
    riskAnalysis.riskScore,
  );


  checkScore(
    findings,
    "Market Rating bounds",
    marketRating.ratingScore,
  );


  checkScore(
    findings,
    "Investment Outlook bounds",
    investmentOutlook.overallScore,
  );


  checkScore(
    findings,
    "Short-term Outlook bounds",
    investmentOutlook.shortTermScore,
  );


  checkScore(
    findings,
    "Long-term Outlook bounds",
    investmentOutlook.longTermScore,
  );


  /*
  |--------------------------------------------------------------------------
  | LABEL / SCORE CONSISTENCY
  |--------------------------------------------------------------------------
  */


  if (
    trendAnalysis.trend ===
    expectedTrendLabel(
      trendAnalysis.strength,
    )
  ) {
    addFinding(
      findings,
      "PASS",
      "Trend label consistency",
      `${trendAnalysis.trend} matches score ${trendAnalysis.strength}.`,
    );
  } else {
    addFinding(
      findings,
      "FAIL",
      "Trend label consistency",
      `Score ${trendAnalysis.strength} maps to ${expectedTrendLabel(
        trendAnalysis.strength,
      )}, but engine returned ${trendAnalysis.trend}.`,
    );
  }


  if (
    riskAnalysis.overallRisk ===
    expectedRiskLabel(
      riskAnalysis.riskScore,
    )
  ) {
    addFinding(
      findings,
      "PASS",
      "Risk label consistency",
      `${riskAnalysis.overallRisk} matches score ${riskAnalysis.riskScore}.`,
    );
  } else {
    addFinding(
      findings,
      "FAIL",
      "Risk label consistency",
      `Score ${riskAnalysis.riskScore} maps to ${expectedRiskLabel(
        riskAnalysis.riskScore,
      )}, but engine returned ${riskAnalysis.overallRisk}.`,
    );
  }


  if (
    marketRating.rating ===
    expectedMarketRatingLabel(
      marketRating.ratingScore,
    )
  ) {
    addFinding(
      findings,
      "PASS",
      "Market Rating label consistency",
      `${marketRating.rating} matches score ${marketRating.ratingScore}.`,
    );
  } else {
    addFinding(
      findings,
      "FAIL",
      "Market Rating label consistency",
      `Score ${marketRating.ratingScore} does not match ${marketRating.rating}.`,
    );
  }


  if (
    investmentOutlook
      .overallOutlook ===
      "Unknown"
  ) {
    addFinding(
      findings,
      "PASS",
      "Outlook label consistency",
      "Outlook is unavailable due to insufficient evidence.",
    );
  } else if (
    investmentOutlook
      .overallOutlook ===
    expectedOutlookLabel(
      investmentOutlook
        .overallScore,
    )
  ) {
    addFinding(
      findings,
      "PASS",
      "Outlook label consistency",
      `${investmentOutlook.overallOutlook} matches score ${investmentOutlook.overallScore}.`,
    );
  } else {
    addFinding(
      findings,
      "FAIL",
      "Outlook label consistency",
      `Score ${investmentOutlook.overallScore} does not match ${investmentOutlook.overallOutlook}.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MISSING-EVIDENCE CONTRACTS
  |--------------------------------------------------------------------------
  */


  if (
    verifiedSalePrices.length ===
    0
  ) {
    if (
      fairValue.fairValue ===
        null &&
      fairValue.methodology ===
        "insufficient"
    ) {
      addFinding(
        findings,
        "PASS",
        "Zero-sale Fair Value handling",
        "No verified sales correctly produces unavailable Fair Value.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Zero-sale Fair Value handling",
        "No verified sales unexpectedly produced Fair Value.",
      );
    }


    if (
      marketHealth.score ===
        null &&
      marketHealth.label ===
        "Unavailable"
    ) {
      addFinding(
        findings,
        "PASS",
        "Zero-sale Market Health handling",
        "Market Health correctly remains unavailable.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Zero-sale Market Health handling",
        "Market Health should be unavailable with zero verified sales.",
      );
    }


    if (
      riskAnalysis
        .liquidityRisk ===
        null &&
      riskAnalysis
        .liquidityRiskScore ===
        null
    ) {
      addFinding(
        findings,
        "PASS",
        "Zero-sale liquidity handling",
        "Liquidity risk correctly remains unmeasured.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Zero-sale liquidity handling",
        "Zero verified sales should not become a synthetic liquidity-risk score.",
      );
    }


    if (
      priceTarget
        .targetPrice ===
        null &&
      priceTarget.verdict ===
        "Unrated"
    ) {
      addFinding(
        findings,
        "PASS",
        "Zero-sale Price Target handling",
        "Price Target correctly remains unrated.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Zero-sale Price Target handling",
        "Price Target should be unrated when Fair Value is unavailable.",
      );
    }


    if (
      investmentOutlook
        .overallOutlook ===
        "Unknown"
    ) {
      addFinding(
        findings,
        "PASS",
        "Zero-sale Outlook handling",
        "Investment Outlook correctly remains Unknown.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Zero-sale Outlook handling",
        "Investment Outlook should be Unknown when Fair Value is unavailable.",
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | VALUATION CONTRACTS
  |--------------------------------------------------------------------------
  */


  if (
    fairValue.fairValue ===
    null
  ) {
    if (
      marketRating
        .valuationScore ===
        null &&
      marketRating
        .valuationDifferencePercent ===
        null
    ) {
      addFinding(
        findings,
        "PASS",
        "Missing valuation exclusion",
        "Market Rating excludes unavailable valuation instead of manufacturing a score.",
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Missing valuation exclusion",
        "Unavailable Fair Value should produce null Market Rating valuation fields.",
      );
    }
  }


  if (
    priceTarget
      .targetAdjustmentPercent !==
    null
  ) {
    const adjustment =
      priceTarget
        .targetAdjustmentPercent;


    if (
      Number.isFinite(
        adjustment,
      ) &&
      adjustment >= -15 &&
      adjustment <= 20
    ) {
      addFinding(
        findings,
        "PASS",
        "Price Target adjustment bounds",
        `${adjustment}% is within -15% to +20%.`,
      );
    } else {
      addFinding(
        findings,
        "FAIL",
        "Price Target adjustment bounds",
        `Invalid target adjustment: ${adjustment}%.`,
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | CROSS-ENGINE CONTRADICTION WARNINGS
  |--------------------------------------------------------------------------
  */


  if (
    crossSourceAgreement
      .score !== null &&
    crossSourceAgreement
      .score < 40
  ) {
    addFinding(
      findings,
      "WARN",
      "Material cross-source divergence",
      `Cross-source agreement is ${crossSourceAgreement.score}/100 (${crossSourceAgreement.agreement}). Review TCGPlayer, completed-sale, and active-market pricing.`,
    );
  }


  if (
    sourceRecency
      .staleSignals.length >
    0
  ) {
    addFinding(
      findings,
      "WARN",
      "Stale market-source evidence",
      `${sourceRecency.staleSignals.join(", ")} source evidence is stale or very stale.`,
    );
  }


  if (
    sourceEvidenceQuality.label ===
      "Insufficient" ||
    sourceEvidenceQuality.score <
      40
  ) {
    addFinding(
      findings,
      "WARN",
      "Thin underlying market evidence",
      `Source Evidence Quality is ${sourceEvidenceQuality.score}/100 (${sourceEvidenceQuality.label}).`,
    );
  }


  if (
    marketAnomalyDetection.level ===
      "Moderate" ||
    marketAnomalyDetection.level ===
      "High"
  ) {
    addFinding(
      findings,
      "WARN",
      "Material market anomaly",
      `Anomaly score is ${marketAnomalyDetection.anomalyScore}/100 (${marketAnomalyDetection.level}) with flags: ${marketAnomalyDetection.flags.join(", ") || "none"}.`,
    );
  }


  if (
    trendAnalysis.strength >=
      65 &&
    riskAnalysis.riskScore >=
      80
  ) {
    addFinding(
      findings,
      "WARN",
      "Bullish / extreme-risk combination",
      `${trendAnalysis.trend} trend (${trendAnalysis.strength}) coexists with ${riskAnalysis.overallRisk} risk (${riskAnalysis.riskScore}). Review explanation quality.`,
    );
  }


  if (
    trendAnalysis.strength <=
      35 &&
    marketRating.ratingScore >=
      80
  ) {
    addFinding(
      findings,
      "WARN",
      "Bearish / strong-rating combination",
      `${trendAnalysis.trend} trend coexists with ${marketRating.rating} Market Rating. Review weighting and explanation.`,
    );
  }


  if (
    riskAnalysis.riskScore >=
      80 &&
    investmentOutlook
      .overallScore >=
      80
  ) {
    addFinding(
      findings,
      "WARN",
      "Extreme-risk / Very Bullish outlook",
      `Risk ${riskAnalysis.riskScore} coexists with outlook ${investmentOutlook.overallScore}.`,
    );
  }


  if (
    sharedConfidence
      .confidence ===
      "Low" &&
    marketRating.ratingScore >=
      90
  ) {
    addFinding(
      findings,
      "WARN",
      "Exceptional rating with low confidence",
      `Rating is ${marketRating.ratingScore}/100 while evidence confidence is only ${sharedConfidence.score}/100.`,
    );
  }


  if (
    verifiedSalePrices.length <=
      1 &&
    sharedConfidence
      .confidence ===
      "High"
  ) {
    addFinding(
      findings,
      "WARN",
      "High confidence with minimal sales",
      `${verifiedSalePrices.length} verified sale(s) but confidence is High.`,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | OPTIONAL SUPPORTING ENGINE CHECKS
  |--------------------------------------------------------------------------
  */


  if (
    dealScore !== null
  ) {
    checkScore(
      findings,
      "Deal Score bounds",
      dealScore.score,
    );
  }


  if (
    investmentGrade !==
    null
  ) {
    checkScore(
      findings,
      "Investment Grade bounds",
      investmentGrade.score,
    );
  }


  return {
    productId:
      product.id,

    productName:
      product.name,

    productSlug:
      product.slug,

    findings,

    snapshot: {
      marketPrice,

      entryPrice,

      fairValue:
        fairValue.fairValue,

      verifiedSales:
        verifiedSalePrices.length,

      activeListings,

      historyPoints:
        priceHistory.length,

      crossSourceScore:
        crossSourceAgreement
          .score,

      crossSourceAgreement:
        crossSourceAgreement
          .agreement,

      crossSourceSignals:
        crossSourceAgreement
          .signalsAvailable,

      crossSourceComparisons:
        crossSourceAgreement
          .comparisonsAvailable,

      realizedSalesDiagnosis:
        crossSourceAgreement
          .realizedSalesDiagnosis,

      realizedSalesReason:
        crossSourceAgreement
          .realizedSalesReason,

      sourceRecencyScore:
        sourceRecency.score,

      sourceRecencyLabel:
        sourceRecency.label,

      evidenceQualityScore:
        sourceEvidenceQuality.score,

      evidenceQualityLabel:
        sourceEvidenceQuality.label,

      salesDepthScore:
        sourceEvidenceQuality
          .salesDepthScore,

      listingDepthScore:
        sourceEvidenceQuality
          .listingDepthScore,

      historyDepthScore:
        sourceEvidenceQuality
          .historyDepthScore,

      crossSourceDepthScore:
        sourceEvidenceQuality
          .crossSourceDepthScore,

      anomalyScore:
        marketAnomalyDetection
          .anomalyScore,

      anomalyLevel:
        marketAnomalyDetection
          .level,

      anomalyFlags:
        marketAnomalyDetection
          .flags,

      saleOutlierCount:
        marketAnomalyDetection
          .saleOutlierCount,

      listingOutlierCount:
        marketAnomalyDetection
          .listingOutlierCount,

      saleDispersionPercent:
        marketAnomalyDetection
          .saleDispersionPercent,

      listingSpreadPercent:
        marketAnomalyDetection
          .listingSpreadPercent,

      lowestListingDiscountPercent:
        marketAnomalyDetection
          .lowestListingDiscountPercent,

      referenceAgeDays:
        sourceRecency
          .reference.ageDays,

      soldAgeDays:
        sourceRecency
          .sold.ageDays,

      activeAgeDays:
        sourceRecency
          .active.ageDays,

      soldMedianPrice:
        crossSourceAgreement
          .soldMedianPrice,

      activeMedianPrice:
        crossSourceAgreement
          .activeMedianPrice,

      confidenceScore:
        sharedConfidence.score,

      confidence:
        sharedConfidence
          .confidence,

      trendScore:
        trendAnalysis.strength,

      trend:
        trendAnalysis.trend,

      riskScore:
        riskAnalysis.riskScore,

      risk:
        riskAnalysis
          .overallRisk,

      marketRatingScore:
        marketRating
          .ratingScore,

      marketRating:
        marketRating.rating,

      priceTarget:
        priceTarget
          .targetPrice,

      priceTargetVerdict:
        priceTarget.verdict,

      outlookScore:
        investmentOutlook
          .overallScore,

      outlook:
        investmentOutlook
          .overallOutlook,
    },
  };
}


async function main(): Promise<void> {
  printHeader(
    "TCGMVP ANALYTICS CATALOG VALIDATION",
  );


  const products =
    await getProducts();


  console.log(
    `Products found: ${products.length}`,
  );


  const results:
    ProductValidationResult[] =
    [];


  let executionFailures =
    0;


  for (
    let index = 0;
    index <
    products.length;
    index += 1
  ) {
    const product =
      products[index];


    console.log("");

    console.log(
      "-".repeat(
        78,
      ),
    );

    console.log(
      `[${index + 1}/${products.length}] ${product.name}`,
    );

    console.log(
      "-".repeat(
        78,
      ),
    );


    try {
      const result =
        await validateProduct({
          id:
            Number(
              product.id,
            ),

          name:
            String(
              product.name,
            ),

          slug:
            String(
              product.slug,
            ),
        });


      results.push(
        result,
      );


      const failures =
        result.findings.filter(
          (
            finding,
          ) =>
            finding.severity ===
            "FAIL",
        );


      const warnings =
        result.findings.filter(
          (
            finding,
          ) =>
            finding.severity ===
            "WARN",
        );


      const {
        snapshot,
      } = result;


      console.log(
        `Evidence: ${snapshot.verifiedSales} sales | ${snapshot.activeListings} listings | ${snapshot.historyPoints} history points`,
      );


      console.log(
        `Cross-Source: ${snapshot.crossSourceScore === null ? "N/A" : `${snapshot.crossSourceScore}/100`} | ${snapshot.crossSourceAgreement} | ${snapshot.crossSourceSignals} signal(s)`,
      );


      console.log(
        `Realized Sales: ${snapshot.realizedSalesDiagnosis}`,
      );


      console.log(
        `Source Recency: ${snapshot.sourceRecencyScore === null ? "N/A" : `${snapshot.sourceRecencyScore}/100`} | ${snapshot.sourceRecencyLabel}`,
      );


      console.log(
        `  Reference: ${snapshot.referenceAgeDays === null ? "N/A" : `${snapshot.referenceAgeDays}d`} | Sold: ${snapshot.soldAgeDays === null ? "N/A" : `${snapshot.soldAgeDays}d`} | Active: ${snapshot.activeAgeDays === null ? "N/A" : `${snapshot.activeAgeDays}d`}`,
      );


      console.log(
        `Evidence Quality: ${snapshot.evidenceQualityScore}/100 | ${snapshot.evidenceQualityLabel}`,
      );


      console.log(
        `  Sales: ${snapshot.salesDepthScore} | Listings: ${snapshot.listingDepthScore} | History: ${snapshot.historyDepthScore} | Cross-Source: ${snapshot.crossSourceDepthScore}`,
      );


      console.log(
        `Anomaly: ${snapshot.anomalyScore}/100 | ${snapshot.anomalyLevel}`,
      );


      console.log(
        `  Sale Outliers: ${snapshot.saleOutlierCount} | Listing Outliers: ${snapshot.listingOutlierCount} | Sale Dispersion: ${snapshot.saleDispersionPercent === null ? "N/A" : `${snapshot.saleDispersionPercent}%`} | Listing Spread: ${snapshot.listingSpreadPercent === null ? "N/A" : `${snapshot.listingSpreadPercent}%`} | Lowest Discount: ${snapshot.lowestListingDiscountPercent === null ? "N/A" : `${snapshot.lowestListingDiscountPercent}%`}`,
      );


      if (
        snapshot.anomalyFlags.length >
        0
      ) {
        console.log(
          `  Anomaly Flags: ${snapshot.anomalyFlags.join(", ")}`,
        );
      }


      console.log(
        `Confidence: ${snapshot.confidence} (${snapshot.confidenceScore})`,
      );


      console.log(
        `Trend: ${snapshot.trend} (${snapshot.trendScore})`,
      );


      console.log(
        `Risk: ${snapshot.risk} (${snapshot.riskScore})`,
      );


      console.log(
        `Market Rating: ${snapshot.marketRating} (${snapshot.marketRatingScore})`,
      );


      console.log(
        `Price Target: ${snapshot.priceTarget === null ? "N/A" : `$${snapshot.priceTarget}`} | ${snapshot.priceTargetVerdict}`,
      );


      console.log(
        `Outlook: ${snapshot.outlook} (${snapshot.outlookScore})`,
      );


      for (
        const finding of
        result.findings
      ) {
        if (
          finding.severity ===
          "PASS"
        ) {
          continue;
        }


        console.log(
          `  ${finding.severity} ${finding.check}: ${finding.message}`,
        );
      }


      if (
        failures.length === 0 &&
        warnings.length === 0
      ) {
        console.log(
          "  PASS No structural or contradiction findings.",
        );
      }
    } catch (
      error
    ) {
      executionFailures +=
        1;


      console.log(
        "  FAIL Analytics execution:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }


  const allFindings =
    results.flatMap(
      (
        result,
      ) =>
        result.findings,
    );


  const failures =
    allFindings.filter(
      (
        finding,
      ) =>
        finding.severity ===
        "FAIL",
    );


  const warnings =
    allFindings.filter(
      (
        finding,
      ) =>
        finding.severity ===
        "WARN",
    );


  const evidenceRich =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .verifiedSales > 0,
    );


  const zeroSales =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .verifiedSales === 0,
    );


  const strongAgreement =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .crossSourceAgreement ===
        "Strong",
    );


  const moderateAgreement =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .crossSourceAgreement ===
        "Moderate",
    );


  const weakAgreement =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .crossSourceAgreement ===
        "Weak",
    );


  const divergentAgreement =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .crossSourceAgreement ===
        "Divergent",
    );


  const unavailableAgreement =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .crossSourceAgreement ===
        "Unavailable",
    );


  const confirmsBoth =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Confirms Both",
    );


  const confirmsReference =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Confirms Reference",
    );


  const confirmsActiveMarket =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Confirms Active Market",
    );


  const betweenMarkets =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Between Markets",
    );


  const independentDivergence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Independent Divergence",
    );


  const realizedSalesUnavailable =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .realizedSalesDiagnosis ===
        "Unavailable",
    );


  const excellentEvidence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .evidenceQualityLabel ===
        "Excellent",
    );


  const strongEvidence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .evidenceQualityLabel ===
        "Strong",
    );


  const moderateEvidence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .evidenceQualityLabel ===
        "Moderate",
    );


  const thinEvidence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .evidenceQualityLabel ===
        "Thin",
    );


  const insufficientEvidence =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .evidenceQualityLabel ===
        "Insufficient",
    );


  const noAnomaly =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .anomalyLevel ===
        "None",
    );


  const lowAnomaly =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .anomalyLevel ===
        "Low",
    );


  const moderateAnomaly =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .anomalyLevel ===
        "Moderate",
    );


  const highAnomaly =
    results.filter(
      (
        result,
      ) =>
        result.snapshot
          .anomalyLevel ===
        "High",
    );


  const reviewProducts =
    results.filter(
      (
        result,
      ) =>
        result.findings.some(
          (
            finding,
          ) =>
            finding.severity ===
              "WARN" ||
            finding.severity ===
              "FAIL",
        ),
    );


  printHeader(
    "CATALOG VALIDATION SUMMARY",
  );


  console.log(
    `Products analyzed: ${results.length}`,
  );


  console.log(
    `Execution failures: ${executionFailures}`,
  );


  console.log("");


  console.log(
    `Products with verified sales: ${evidenceRich.length}`,
  );


  console.log(
    `Products with zero verified sales: ${zeroSales.length}`,
  );


  console.log("");


  console.log(
    "Cross-Source Agreement:",
  );


  console.log(
    `Strong: ${strongAgreement.length}`,
  );


  console.log(
    `Moderate: ${moderateAgreement.length}`,
  );


  console.log(
    `Weak: ${weakAgreement.length}`,
  );


  console.log(
    `Divergent: ${divergentAgreement.length}`,
  );


  console.log(
    `Unavailable: ${unavailableAgreement.length}`,
  );


  console.log("");


  console.log(
    "Realized-Sales Confirmation:",
  );


  console.log(
    `Confirms Both: ${confirmsBoth.length}`,
  );


  console.log(
    `Confirms Reference: ${confirmsReference.length}`,
  );


  console.log(
    `Confirms Active Market: ${confirmsActiveMarket.length}`,
  );


  console.log(
    `Between Markets: ${betweenMarkets.length}`,
  );


  console.log(
    `Independent Divergence: ${independentDivergence.length}`,
  );


  console.log(
    `Unavailable: ${realizedSalesUnavailable.length}`,
  );


  console.log("");


  console.log(
    "Source Evidence Quality:",
  );


  console.log(
    `Excellent: ${excellentEvidence.length}`,
  );


  console.log(
    `Strong: ${strongEvidence.length}`,
  );


  console.log(
    `Moderate: ${moderateEvidence.length}`,
  );


  console.log(
    `Thin: ${thinEvidence.length}`,
  );


  console.log(
    `Insufficient: ${insufficientEvidence.length}`,
  );


  console.log("");


  console.log(
    "Market Anomaly Detection:",
  );


  console.log(
    `None: ${noAnomaly.length}`,
  );


  console.log(
    `Low: ${lowAnomaly.length}`,
  );


  console.log(
    `Moderate: ${moderateAnomaly.length}`,
  );


  console.log(
    `High: ${highAnomaly.length}`,
  );


  console.log("");


  console.log(
    `Validation failures: ${failures.length}`,
  );


  console.log(
    `Validation warnings: ${warnings.length}`,
  );


  console.log(
    `Products requiring review: ${reviewProducts.length}`,
  );


  if (
    reviewProducts.length > 0
  ) {
    console.log("");


    console.log(
      "Products requiring review:",
    );


    for (
      const result of
      reviewProducts
    ) {
      const productFailures =
        result.findings.filter(
          (
            finding,
          ) =>
            finding.severity ===
            "FAIL",
        ).length;


      const productWarnings =
        result.findings.filter(
          (
            finding,
          ) =>
            finding.severity ===
            "WARN",
        ).length;


      console.log(
        `- ${result.productName}: ${productFailures} failure(s), ${productWarnings} warning(s)`,
      );
    }
  }


  console.log("");


  if (
    executionFailures > 0 ||
    failures.length > 0
  ) {
    console.log(
      "Catalog Validation: FAIL",
    );


    process.exitCode =
      1;

    return;
  }


  if (
    warnings.length > 0
  ) {
    console.log(
      "Catalog Validation: PASS WITH REVIEW",
    );

    return;
  }


  console.log(
    "Catalog Validation: PASS",
  );
}


main().catch(
  (
    error,
  ) => {
    console.error(
      "Analytics catalog validation failed:",
      error,
    );


    process.exit(
      1,
    );
  },
);