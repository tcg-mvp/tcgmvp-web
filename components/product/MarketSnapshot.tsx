import DealScore from "./DealScore";
import FairValue from "./FairValue";
import MarketHealth from "./MarketHealth";
import InvestmentGrade from "./InvestmentGrade";

import { calculateFairValue } from "@/lib/analytics/fairValue";
import { calculateMarketHealth } from "@/lib/analytics/marketHealth";
import { calculateDealScore } from "@/lib/analytics/dealScore";
import { calculateInvestmentGrade } from "@/lib/analytics/investmentGrade";

type Sale = {
  sale_price: number | string;
};

type Listing = {
  listing_price: number | string;
};

type MarketSnapshotProps = {
  sales: Sale[];
  listings: Listing[];
};

function formatCurrency(value: number | null) {
  if (value === null) return "N/A";

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function MarketSnapshot({
  sales,
  listings,
}: MarketSnapshotProps) {
  const salePrices = sales
    .map((sale) => Number(sale.sale_price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const listingPrices = listings
    .map((listing) => Number(listing.listing_price))
    .filter((price) => Number.isFinite(price) && price > 0);

  const latestSale =
    salePrices.length > 0 ? salePrices[0] : null;

  const averageSale =
    salePrices.length > 0
      ? salePrices.reduce(
          (total, price) => total + price,
          0,
        ) / salePrices.length
      : null;

  const lowestListing =
    listingPrices.length > 0
      ? Math.min(...listingPrices)
      : null;

  const averageListing =
    listingPrices.length > 0
      ? listingPrices.reduce(
          (total, price) => total + price,
          0,
        ) / listingPrices.length
      : null;

  const recentSalesCount = salePrices.length;
  const activeListingsCount = listingPrices.length;

  const fairValueResult = calculateFairValue({
    sales: salePrices,
  });

  const fairMarketValue = fairValueResult.fairValue;

  const marketHealthResult = calculateMarketHealth({
    sales: salePrices,
    listings: listingPrices,
  });

  const dealScoreResult =
    fairMarketValue !== null && lowestListing !== null
      ? calculateDealScore({
          fairMarketValue,
          listingPrice: lowestListing,
          recentSalesCount,
          activeListingsCount,
        })
      : null;
  const investmentGradeResult =
    dealScoreResult !== null
      ? calculateInvestmentGrade({
          marketHealthScore: marketHealthResult.score,
          liquidityScore: marketHealthResult.liquidityScore,
          supplyBalanceScore:
            marketHealthResult.supplyBalanceScore,
          priceStabilityScore:
            marketHealthResult.priceStabilityScore,
          dealScore: dealScoreResult.score,
        })
      : null;
  return (
    <>
      <section className="market-snapshot">
        <div className="snapshot-heading">
          <div>
            <span className="section-kicker">
              Market intelligence
            </span>

            <h2>Market snapshot</h2>

            <p>
              A quick view of recent sales, active supply,
              and current asking prices.
            </p>
          </div>

          <div className="snapshot-heading-stat">
            <strong>
              {recentSalesCount + activeListingsCount}
            </strong>

            <span>DATA POINTS</span>
          </div>
        </div>

        <div className="snapshot-grid">
          <div className="snapshot-card">
            <span>Latest Sale</span>
            <strong>{formatCurrency(latestSale)}</strong>
          </div>

          <div className="snapshot-card">
            <span>Average Sale</span>
            <strong>{formatCurrency(averageSale)}</strong>
          </div>

          <div className="snapshot-card">
            <span>Lowest Listing</span>
            <strong>{formatCurrency(lowestListing)}</strong>
          </div>

          <div className="snapshot-card">
            <span>Average Listing</span>
            <strong>{formatCurrency(averageListing)}</strong>
          </div>

          <div className="snapshot-card">
            <span>Sales Tracked</span>
            <strong>{recentSalesCount}</strong>
          </div>

          <div className="snapshot-card">
            <span>Active Listings</span>
            <strong>{activeListingsCount}</strong>
          </div>
        </div>
      </section>

      <FairValue
        fairValue={fairValueResult.fairValue}
        medianSale={fairValueResult.medianSale}
        averageSale={fairValueResult.averageSale}
        lowestSale={fairValueResult.lowestSale}
        highestSale={fairValueResult.highestSale}
        salesCount={fairValueResult.salesCount}
        listingPrice={lowestListing}
      />

      <MarketHealth result={marketHealthResult} />

      {dealScoreResult && (
        <DealScore
          result={dealScoreResult}
          fairMarketValue={fairValueResult.fairValue}
          listingPrice={lowestListing}
          recentSalesCount={salePrices.length}
          activeListingsCount={listingPrices.length}
        />
      )}

      {investmentGradeResult && (
        <InvestmentGrade
          result={investmentGradeResult}
        />
      )}
    </>
  );
}