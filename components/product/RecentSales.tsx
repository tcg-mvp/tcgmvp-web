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

type RecentSalesProps = {
  sales: MarketSale[];
};

function formatCurrency(
  value: number | string | null
): string {
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

function formatSaleType(
  saleType: string | null
): string {
  if (!saleType) {
    return "Sale";
  }

  return saleType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatSaleDate(
  date: string
): string {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  ).format(
    new Date(date)
  );
}

export default function RecentSales({
  sales,
}: RecentSalesProps) {
  return (
    <section className="recent-sales-section">
      <div className="container">
        <div className="recent-sales-panel">
          <div className="recent-sales-heading">
            <div>
              <span className="section-kicker">
                Transaction data
              </span>

              <h2>
                Recent sales
              </h2>

              <p>
                Latest recorded sales for this product
                across supported marketplaces.
              </p>
            </div>

            <div className="recent-sales-count">
              <strong>
                {sales.length}
              </strong>

              <span>
                sales shown
              </span>
            </div>
          </div>

          {sales.length > 0 ? (
            <div className="recent-sales-table-wrapper">
              <table className="recent-sales-table">
                <thead>
                  <tr>
                    <th>
                      Sale price
                    </th>

                    <th>
                      Marketplace
                    </th>

                    <th>
                      Sale type
                    </th>

                    <th>
                      Date sold
                    </th>

                    <th>
                      Status
                    </th>

                    <th aria-label="Listing link" />
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => {
                    const hasKnownShipping =
                      sale.shipping_price !== null;

                    const displayPrice =
                      sale.total_price !== null
                        ? sale.total_price
                        : sale.sale_price;

                    return (
                      <tr key={sale.id}>
                        <td>
                          <div className="recent-sale-price">
                            <strong>
                              {formatCurrency(
                                displayPrice
                              )}
                            </strong>

                            {sale.total_price !== null ? (
                              Number(
                                sale.shipping_price
                              ) > 0 ? (
                                <span>
                                  Includes{" "}
                                  {formatCurrency(
                                    sale.shipping_price
                                  )}{" "}
                                  shipping
                                </span>
                              ) : (
                                <span>
                                  Free shipping
                                </span>
                              )
                            ) : !hasKnownShipping ? (
                              <span>
                                Shipping not available
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <span className="marketplace-pill">
                            {sale.marketplace}
                          </span>
                        </td>

                        <td>
                          {formatSaleType(
                            sale.sale_type
                          )}
                        </td>

                        <td>
                          {formatSaleDate(
                            sale.sold_at
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              sale.is_verified
                                ? "sale-status verified"
                                : "sale-status sample"
                            }
                          >
                            {sale.is_verified
                              ? "Verified"
                              : "Unverified"}
                          </span>
                        </td>

                        <td>
                          {sale.listing_url ? (
                            <a
                              className="sale-link"
                              href={
                                sale.listing_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View sale for ${sale.title}`}
                            >
                              ↗
                            </a>
                          ) : (
                            <span className="sale-link-disabled">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="recent-sales-empty">
              <strong>
                No recent sales available
              </strong>

              <p>
                Sales data has not yet been recorded
                for this product.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}