import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  name: string;
  slug: string;
  image_url: string | null;
  productType: string;
  language: string;
  series: string;
  marketPrice: number | null;
  change30d: number | null;
};

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export default function ProductCard({
  name,
  slug,
  image_url,
  productType,
  language,
  series,
  marketPrice,
  change30d,
}: ProductCardProps) {
  const changeTone =
    change30d === null
      ? "neutral"
      : change30d > 0
        ? "positive"
        : change30d < 0
          ? "negative"
          : "neutral";

  const productName = name
    .replace(` ${productType}`, "")
    .trim();

  return (
    <Link
      href={`/products/${slug}`}
      className="market-product-card"
      aria-label={`View market research for ${name}`}
    >
      <div className="market-product-card-art">
        <div className="market-product-card-badge">
          <span className="market-product-card-badge-dot" />
          Live market
        </div>

        {image_url ? (
          <Image
            src={image_url}
            alt={`${name} product image`}
            width={420}
            height={420}
            className="market-product-card-image"
          />
        ) : (
          <div className="market-product-card-placeholder">
            <span>TCGMVP</span>
            <strong>{productName}</strong>
            <small>{productType}</small>
          </div>
        )}
      </div>

      <div className="market-product-card-content">
        <div className="market-product-card-heading">
          <div>
            <span className="market-product-card-meta">
              {productType} · {language}
            </span>

            <h3>
              <span>{productName}</span>
              <small>{productType}</small>
            </h3>

            <p>{series}</p>
          </div>

          <span className="market-product-card-arrow" aria-hidden="true">
            ↗
          </span>
        </div>

        <div className="market-product-card-metrics">
          <div>
            <span>Current price</span>
            <strong>{formatCurrency(marketPrice)}</strong>
          </div>

          <div>
            <span>30-day movement</span>
            <strong className={changeTone}>
              {formatPercent(change30d)}
            </strong>
          </div>
        </div>

        <div className="market-product-card-footer">
          <span>View market report</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}