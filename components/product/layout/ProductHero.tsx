import Image from "next/image";

type MetricTone =
  | "default"
  | "positive"
  | "negative"
  | "warning"
  | "gold";

type ProductHeroMetric = {
  label: string;
  value: string;
  detail: string;
  featured?: boolean;
  valueTone?: MetricTone;
  detailTone?: MetricTone;
};

type ProductHeroProps = {
  imageUrl: string | null;
  productName: string;
  productType: string;
  seriesName: string;
  languageName: string;
  marketPrice: string;
  change30d: string;
  changeTone: "positive" | "negative" | "neutral";
  metrics: ProductHeroMetric[];
};

export default function ProductHero({
  imageUrl,
  productName,
  productType,
  seriesName,
  languageName,
  marketPrice,
  change30d,
  changeTone,
  metrics,
}: ProductHeroProps) {
  return (
    <section className="product-detail-hero product-detail-hero-v2">
      <div className="container product-detail-hero-grid product-detail-hero-grid-v2">
        <div className="product-detail-image-area product-detail-image-area-v2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${productName} product image`}
              width={620}
              height={620}
              priority
              className="product-detail-image product-detail-image-v2"
            />
          ) : (
            <div className="product-detail-image-placeholder">
              Product image unavailable
            </div>
          )}
        </div>

        <div className="product-detail-information product-detail-information-v2">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Live product intelligence
          </div>

          <h1 className="product-hero-title">
            <span className="product-hero-title-name">
              {productName}
            </span>

            <span className="product-hero-title-type">
              {productType}
            </span>
          </h1>

          <p className="product-detail-meta">
            {seriesName} · {languageName}
          </p>

          <div className="product-hero-price-row">
            <div>
              <span>Current market price</span>
              <strong>{marketPrice}</strong>
            </div>

            <div>
              <span>30-day movement</span>
              <strong className={changeTone}>
                {change30d}
              </strong>
            </div>
          </div>

          <div className="product-hero-intelligence-grid">
            {metrics.map((metric) => {
              const valueTone =
                metric.valueTone ?? "default";

              const detailTone =
                metric.detailTone ?? "default";

              return (
                <div
                  className={`product-hero-metric${
                    metric.featured
                      ? " product-hero-metric-featured"
                      : ""
                  }`}
                  key={metric.label}
                >
                  <span>{metric.label}</span>

                  <strong
                    className={`product-hero-metric-value product-hero-metric-value-${valueTone}`}
                  >
                    {metric.value}
                  </strong>

                  <small
                    className={`product-hero-metric-detail product-hero-metric-detail-${detailTone}`}
                  >
                    {metric.detail}
                  </small>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}