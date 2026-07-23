import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import PriceChart from "@/components/PriceChart";
import { supabase } from "@/lib/supabase";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      image_url,
      sets (
        name,
        overview,
        series (
          name
        )
      ),
      languages (
        name
      ),
      product_types (
        name
      ),
      product_market_summary (
        current_market_price,
        change_30d_percent
      ),
      product_price_history (
        price,
        recorded_at
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !product) {
    notFound();
  }

  const setData = Array.isArray(product.sets)
    ? product.sets[0]
    : product.sets;

  const seriesData = Array.isArray(setData?.series)
    ? setData.series[0]
    : setData?.series;

  const languageData = Array.isArray(product.languages)
    ? product.languages[0]
    : product.languages;

  const productTypeData = Array.isArray(product.product_types)
    ? product.product_types[0]
    : product.product_types;

  const marketData = Array.isArray(product.product_market_summary)
    ? product.product_market_summary[0]
    : product.product_market_summary;

  const marketPrice =
    marketData?.current_market_price === null ||
    marketData?.current_market_price === undefined
      ? null
      : Number(marketData.current_market_price);

  const change30d =
    marketData?.change_30d_percent === null ||
    marketData?.change_30d_percent === undefined
      ? null
      : Number(marketData.change_30d_percent);
  const priceHistory = Array.isArray(product.product_price_history)
    ? product.product_price_history
        .map((item) => ({
          price: Number(item.price),
          recorded_at: item.recorded_at,
        }))
        .sort(
          (a, b) =>
            new Date(a.recorded_at).getTime() -
            new Date(b.recorded_at).getTime()
        )
    : [];
  return (
    <main className="site-shell products-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="nav-wrap">
        <nav className="nav container">
          <Link className="brand" href="/">
            <span className="brand-mark">M</span>
            <span>TCGMVP</span>
          </Link>

          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/products">Market</Link>
            <span>Portfolio</span>
            <span>Watchlist</span>
          </div>

          <Link
            className="button button-small button-primary"
            href="/products"
          >
            Back to market
            <span>↗</span>
          </Link>
        </nav>
      </header>

<section className="product-detail-hero">
  <div className="container product-detail-hero-grid">
    <div className="product-detail-image-area">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={`${product.name} product image`}
          width={600}
          height={600}
          priority
          className="product-detail-image"
        />
      ) : (
        <div className="product-detail-image-placeholder">
          Product image unavailable
        </div>
      )}
    </div>

    <div className="product-detail-information">
      <div className="eyebrow">
        <span className="eyebrow-dot" />
        Live product intelligence
      </div>

      <h1>
        {product.name.replace(" Booster Box", "")}{" "}
        <span className="gradient-text">
          {productTypeData?.name ?? "Sealed Product"}
        </span>
      </h1>

      <p className="product-detail-meta">
        {seriesData?.name ?? "Unknown Series"} ·{" "}
        {languageData?.name ?? "Unknown Language"}
      </p>

      <div className="products-market-summary product-market-panel">
        <div>
          <span>Market price</span>
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
          <span>30-day movement</span>
          <strong
            className={
              change30d !== null && change30d < 0
                ? "negative"
                : "positive"
            }
          >
            {change30d === null
              ? "N/A"
              : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong className="positive">Tracked</strong>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="product-chart-section">
  <div className="container">
    <div className="product-chart-panel">
      <div className="product-chart-heading">
        <div>
          <span className="section-kicker">Price history</span>
          <h2>Market performance</h2>
        </div>

      </div>

      <PriceChart data={priceHistory} />
    </div>
  </div>
</section>

<section className="product-overview-section">
  <div className="container">
    <div className="product-overview-panel">
      <span className="section-kicker">Product overview</span>

      <p>
        {setData?.overview ??
          "Product overview is not available yet."}
      </p>
    </div>
  </div>
</section>
    </main>
  );
}