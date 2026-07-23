import Link from "next/link";

type ProductCardProps = {
  name: string;
  slug: string;
  productType: string;
  language: string;
  series: string;
  marketPrice: number | null;
  change30d: number | null;
};

function getTone(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes("evolving skies")) return "sky";
  if (normalized.includes("chilling reign")) return "ice";
  if (normalized.includes("team up")) return "violet";

  return "sky";
}

export default function ProductCard({
  name,
  slug,
  productType,
  language,
  series,
  marketPrice,
  change30d,
}: ProductCardProps) {
  const tone = getTone(name);

  const formattedPrice =
    marketPrice === null
      ? "N/A"
      : marketPrice.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        });

  const formattedChange =
    change30d === null
      ? "N/A"
      : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`;

  const changeClass =
    change30d !== null && change30d < 0 ? "negative" : "positive";

  return (
    <Link
      href={`/products/${slug}`}
      className={`product-card product-${tone}`}
    >
      <div className="product-art">
        <div className="product-box">
          <span className="product-brand">TCGMVP</span>

          <strong>{name.replace(" Booster Box", "")}</strong>

          <small>{productType}</small>
        </div>

        <div className="product-live-pill">
          <span />
          Live market
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-card-heading">
          <div>
            <span className="mini-label">
              {productType} · {language}
            </span>

            <h3>{name}</h3>

            <p>{series}</p>
          </div>

          <span className="product-arrow">↗</span>
        </div>

        <div className="product-stat-row">
          <div>
            <span>Market</span>
            <strong>{formattedPrice}</strong>
          </div>

          <div>
            <span>30 days</span>
            <strong className={changeClass}>{formattedChange}</strong>
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