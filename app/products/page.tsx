import Link from "next/link";

import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      sets (
        name,
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
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.log("Supabase products error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return (
      <main className="min-h-screen bg-[#07111f] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Unable to load products</h1>

          <p className="mt-3 text-white/60">
            The website could not retrieve product data from Supabase.
          </p>

          <pre className="mt-6 overflow-auto rounded-xl bg-red-950/40 p-4 text-sm text-red-200">
            {JSON.stringify(
              {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    );
  }

  if (!products || products.length === 0) {
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

            <Link className="button button-small button-primary" href="/">
              Back home
              <span>↗</span>
            </Link>
          </nav>
        </header>

        <section className="products-hero container">
          <div className="products-hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Live Pokémon market tracking
            </div>

            <h1>
              Explore the sealed{" "}
              <span className="gradient-text">product market.</span>
            </h1>

            <p>
              Compare market values and performance across tracked Pokémon
              sealed products.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="empty-market-state">
              <h2>No products found</h2>
              <p>
                Your database connected successfully, but no active products
                were returned.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

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

          <Link className="button button-small button-primary" href="/">
            Back home
            <span>↗</span>
          </Link>
        </nav>
      </header>

      <section className="products-hero container">
        <div className="products-hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Live Pokémon market tracking
          </div>

          <h1>
            Explore the sealed{" "}
            <span className="gradient-text">product market.</span>
          </h1>

          <p>
            Compare values, market movement, liquidity, and historical
            performance across tracked English Pokémon sealed products.
          </p>
        </div>

        <div className="products-market-summary">
          <div>
            <span>Tracked products</span>
            <strong>{products.length}</strong>
          </div>

          <div>
            <span>Primary market</span>
            <strong>English Pokémon</strong>
          </div>

          <div>
            <span>Data status</span>
            <strong className="positive">Live</strong>
          </div>
        </div>
      </section>

      <section
        className="market-ticker"
        aria-label="Current market movement"
      >
        <div className="ticker-track">
          {[0, 1].map((group) => (
            <div className="ticker-group" key={group}>
              {products.map((product) => {
                const marketData = Array.isArray(
                  product.product_market_summary
                )
                  ? product.product_market_summary[0]
                  : product.product_market_summary;

                const change =
                  marketData?.change_30d_percent === null ||
                  marketData?.change_30d_percent === undefined
                    ? null
                    : Number(marketData.change_30d_percent);

                return (
                  <span key={`${group}-${product.id}`}>
                    <strong>
                      {product.name.replace(" Booster Box", "")}
                    </strong>

                    <b
                      className={
                        change !== null && change < 0
                          ? "negative"
                          : "positive"
                      }
                    >
                      {change === null
                        ? "N/A"
                        : `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`}
                    </b>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="section product-showcase-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Market watch</span>
              <h2>Tracked sealed products.</h2>
            </div>

            <p>
              Select a product to view its market value, recent movement,
              transactions, listings, and long-term performance.
            </p>
          </div>

          <div className="product-showcase">
            {products.map((product) => {
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

              const marketData = Array.isArray(
                product.product_market_summary
              )
                ? product.product_market_summary[0]
                : product.product_market_summary;

              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  slug={product.slug}
                  productType={productTypeData?.name ?? "Sealed Product"}
                  language={languageData?.name ?? "Unknown"}
                  series={seriesData?.name ?? "Unknown Series"}
                  marketPrice={
                    marketData?.current_market_price === null ||
                    marketData?.current_market_price === undefined
                      ? null
                      : Number(marketData.current_market_price)
                  }
                  change30d={
                    marketData?.change_30d_percent === null ||
                    marketData?.change_30d_percent === undefined
                      ? null
                      : Number(marketData.change_30d_percent)
                  }
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}