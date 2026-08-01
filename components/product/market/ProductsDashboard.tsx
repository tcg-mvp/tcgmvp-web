type ProductsDashboardProps = {
  trackedProducts: number;
  averageChange30d: number | null;
  positiveMovers: number;
  negativeMovers: number;
  productsWithMovement: number;
};

function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function ProductsDashboard({
  trackedProducts,
  averageChange30d,
  positiveMovers,
  negativeMovers,
  productsWithMovement,
}: ProductsDashboardProps) {
  const averageTone =
    averageChange30d === null
      ? "neutral"
      : averageChange30d > 0
        ? "positive"
        : averageChange30d < 0
          ? "negative"
          : "neutral";

  return (
    <section
      className="products-dashboard-section"
      aria-labelledby="products-dashboard-title"
    >
      <div className="container">
        <div className="products-dashboard">
          <div className="products-dashboard-heading">
            <div>
              <span className="section-kicker">Market overview</span>

              <h2 id="products-dashboard-title">
                Current sealed-market activity.
              </h2>
            </div>

            <p>
              A high-level view of the products and recent price movement
              currently tracked by TCGMVP.
            </p>
          </div>

          <div className="products-dashboard-grid">
            <article className="products-dashboard-card products-dashboard-card-featured">
              <span>Tracked products</span>
              <strong>{trackedProducts}</strong>
              <small>Active products in the market database</small>
            </article>

            <article className="products-dashboard-card">
              <span>Average 30-day movement</span>
              <strong className={averageTone}>
                {formatPercent(averageChange30d)}
              </strong>
              <small>
                Based on {productsWithMovement} product
                {productsWithMovement === 1 ? "" : "s"} with available history
              </small>
            </article>

            <article className="products-dashboard-card">
              <span>Positive movers</span>
              <strong className="positive">{positiveMovers}</strong>
              <small>Products trading above their 30-day reference price</small>
            </article>

            <article className="products-dashboard-card">
              <span>Negative movers</span>
              <strong className="negative">{negativeMovers}</strong>
              <small>Products trading below their 30-day reference price</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}