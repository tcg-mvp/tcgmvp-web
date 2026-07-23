import Link from "next/link";
import { notFound } from "next/navigation";

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

      <section className="products-hero container">
        <div className="products-hero-copy">
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

          <p>
            {seriesData?.name ?? "Unknown Series"} ·{" "}
            {languageData?.name ?? "Unknown Language"}
          </p>
        </div>

        <div className="products-market-summary">
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
      </section>

      <section className="section">
        <div className="container">
          <div className="empty-market-state">
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