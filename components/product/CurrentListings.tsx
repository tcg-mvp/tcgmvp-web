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

type CurrentListingsProps = {
  listings: MarketListing[];
};

function formatCurrency(value: number | string | null) {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatListingType(listingType: string | null) {
  if (!listingType) {
    return "Listing";
  }

  return listingType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date: string | null) {
  if (!date) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function CurrentListings({
  listings,
}: CurrentListingsProps) {
  return (
    <section className="current-listings-section">
      <div className="container">
        <div className="current-listings-panel">
          <div className="current-listings-heading">
            <div>
              <span className="section-kicker">Active market</span>
              <h2>Current listings</h2>
              <p>
                Active asking prices currently tracked across supported
                marketplaces.
              </p>
            </div>

            <div className="current-listings-count">
              <strong>{listings.length}</strong>
              <span>listings shown</span>
            </div>
          </div>

          {listings.length > 0 ? (
            <div className="current-listings-table-wrapper">
              <table className="current-listings-table">
                <thead>
                  <tr>
                    <th>Total price</th>
                    <th>Marketplace</th>
                    <th>Seller</th>
                    <th>Listing type</th>
                    <th>Last seen</th>
                    <th aria-label="Listing link" />
                  </tr>
                </thead>

                <tbody>
                  {listings.map((listing) => {
                    const totalPrice =
                      listing.total_price ??
                      Number(listing.listing_price) +
                        Number(listing.shipping_price);

                    return (
                      <tr key={listing.id}>
                        <td>
                          <div className="current-listing-price">
                            <strong>{formatCurrency(totalPrice)}</strong>

                            {Number(listing.shipping_price) > 0 && (
                              <span>
                                Includes{" "}
                                {formatCurrency(listing.shipping_price)} shipping
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="marketplace-pill">
                            {listing.marketplace}
                          </span>
                        </td>

                        <td>
                          <div className="listing-seller">
                            <strong>
                              {listing.seller_name ?? "Unknown seller"}
                            </strong>

                            {listing.seller_feedback !== null && (
                              <span>
                                {Number(listing.seller_feedback).toFixed(1)}%
                                feedback
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          {formatListingType(listing.listing_type)}
                        </td>

                        <td>{formatDate(listing.last_seen)}</td>

                        <td>
                          {listing.listing_url ? (
                            <a
                              className="sale-link"
                              href={listing.listing_url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View listing for ${listing.title}`}
                            >
                              ↗
                            </a>
                          ) : (
                            <span className="sale-link-disabled">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="current-listings-empty">
              <strong>No active listings available</strong>
              <p>
                Current listing data has not yet been recorded for this
                product.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}