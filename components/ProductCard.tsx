import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  name: string;
  slug: string;
  image_url: string| null;
  productType: string;
  language: string;
  series: string;
  marketPrice: number | null;
  change30d: number | null;
};

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
  const changeClass =
    change30d !== null && change30d < 0 ? "negative" : "positive";

  const productTone = name.toLowerCase().includes("evolving")
    ? "sky"
    : name.toLowerCase().includes("chilling")
      ? "ice"
      : "violet";
console.log(name, image_url);
  return (
    <Link
      href={`/products/${slug}`}
      className={`product-card product-${productTone}`}
    >
      <div className="product-art">
        {image_url ? (
          <Image
            src={image_url}
            alt={`${name} Booster Box`}
            width={400}
            height={400}
            className="product-image"
          />
        ) : (
          <div className="product-box">
            <span className="product-brand">TCGMVP</span>
            <strong>{name.replace(" Booster Box", "")}</strong>
            <small>{productType}</small>
          </div>
        )}

        <span>Live market</span>
      </div>

      <div className="product-card-body">
        <div>
          <span className="mini-label">
            {productType} · {language}
          </span>

          <h3>{name}</h3>
          <p>{series}</p>
          <span>↗</span>
        </div>

        <div className="product-stat-row">
          <div>
            <span>Market</span>
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
            <span>30 days</span>
            <strong className={changeClass}>
              {change30d === null
                ? "N/A"
                : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>Tracked</strong>
          </div>
        </div>
      </div>
    </Link>
  );
}