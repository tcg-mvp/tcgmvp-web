import DealScore from "./DealScore";
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
function calculateMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return (
      (sortedValues[middleIndex - 1] +
        sortedValues[middleIndex]) /
      2
    );
  }

  return sortedValues[middleIndex];
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

  const latestSale = salePrices.length > 0 ? salePrices[0] : null;

  const averageSale =
    salePrices.length > 0
      ? salePrices.reduce((total, price) => total + price, 0) /
        salePrices.length
      : null;

  const lowestListing =
    listingPrices.length > 0 ? Math.min(...listingPrices) : null;

  const averageListing =
    listingPrices.length > 0
      ? listingPrices.reduce((total, price) => total + price, 0) /
        listingPrices.length
      : null;
  const fairMarketValue = calculateMedian(salePrices);

  const recentSalesCount = salePrices.length;

  const activeListingsCount = listingPrices.length;   

  return (
      <>
    <DealScore
      fairMarketValue={fairMarketValue}
      listingPrice={lowestListing}
      recentSalesCount={recentSalesCount}
      activeListingsCount={activeListingsCount}
    />
    <section className="market-snapshot">
      <div className="snapshot-heading">
        <div>
          <span className="section-kicker">Market intelligence</span>
          <h2>Market snapshot</h2>
          <p>
            A quick view of recent sales, active supply, and current asking
            prices.
          </p>
        </div>

        <div className="snapshot-heading-stat">
          <strong>{sales.length + listings.length}</strong>
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
          <strong>{sales.length}</strong>
        </div>

        <div className="snapshot-card">
          <span>Active Listings</span>
          <strong>{listings.length}</strong>
        </div>
      </div>
    </section>
    </>
  );
}