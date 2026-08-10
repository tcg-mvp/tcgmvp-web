import Link from "next/link";
import Image from "next/image";
import ProductsScreener, {
  type ScreenerProduct,
} from "@/components/product/market/ProductsScreener";
import ProductsDashboard from "@/components/product/market/ProductsDashboard";
import { supabase } from "@/lib/supabase";

export default async function ProductsPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      image_url,
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
              <Image
                src="/tcgmvp-mark.png"
                alt="TCGMVP"
                width={48}
                height={48}
                className="brand-logo"
                priority
              />
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

        <h1 className="products-hero-title">
          <span>Explore the sealed</span>
          <span className="products-hero-title-accent">
            product market.
          </span>
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
  const productsWithMarketData = products.map((product) => {
    const marketSummary = Array.isArray(
      product.product_market_summary
    )
      ? product.product_market_summary[0]
      : product.product_market_summary;

    return {
      ...product,
      marketPrice:
        marketSummary?.current_market_price !== null &&
        marketSummary?.current_market_price !== undefined
          ? Number(marketSummary.current_market_price)
          : null,
      change30d:
        marketSummary?.change_30d_percent !== null &&
        marketSummary?.change_30d_percent !== undefined
          ? Number(marketSummary.change_30d_percent)
          : null,
    };
  });

  const availableChanges = productsWithMarketData
    .map((product) => product.change30d)
    .filter((change): change is number => change !== null);

  const averageChange30d =
    availableChanges.length > 0
      ? availableChanges.reduce(
          (sum, change) => sum + change,
          0
        ) / availableChanges.length
      : null;

  const positiveMovers = availableChanges.filter(
    (change) => change > 0
  ).length;

  const negativeMovers = availableChanges.filter(
    (change) => change < 0
  ).length;
  const screenerProducts: ScreenerProduct[] =
    productsWithMarketData.map((product) => {
      const setData = Array.isArray(product.sets)
        ? product.sets[0]
        : product.sets;

      const seriesData = Array.isArray(setData?.series)
        ? setData.series[0]
        : setData?.series;

      const languageData = Array.isArray(product.languages)
        ? product.languages[0]
        : product.languages;

      const productTypeData = Array.isArray(
        product.product_types
      )
        ? product.product_types[0]
        : product.product_types;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.image_url,
        productType:
          productTypeData?.name ?? "Sealed Product",
        language: languageData?.name ?? "Unknown",
        series: seriesData?.name ?? "Unknown Series",
        marketPrice: product.marketPrice,
        change30d: product.change30d,
      };
    });

  return (
    <main className="site-shell products-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="nav-wrap">
        <nav className="nav container">
      <Link href="/" className="brand">
        <Image
          src="/tcgmvp-mark.png"
          alt="TCGMVP"
          width={48}
          height={48}
          className="brand-logo"
          priority
        />
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

          <h1 className="products-hero-title">
            <span>Explore the sealed</span>
            <span className="products-hero-title-accent">
              product market.
            </span>
          </h1>

          <p>
            Compare values, market movement, liquidity, and historical
            performance across tracked English Pokémon sealed products.
          </p>
        </div>

      </section>

        <ProductsDashboard
          trackedProducts={products.length}
          averageChange30d={averageChange30d}
          positiveMovers={positiveMovers}
          negativeMovers={negativeMovers}
          productsWithMovement={availableChanges.length}
        />

      <section
        className="market-ticker"
        aria-label="Current market movement"
      >
        <div className="ticker-track">
          {[0, 1].map((group) => (
            <div className="ticker-group" key={group}>
              {productsWithMarketData.map((product) => {
                const change30d = product.change30d;

                return (
                  <span key={`${group}-${product.id}`}>
                    <strong>
                      {product.name.replace(" Booster Box", "")}
                    </strong>

                    <b
                      className={
                        change30d !== null && change30d < 0
                          ? "negative"
                          : "positive"
                      }
                    >
                      {change30d === null
                        ? "N/A"
                        : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(2)}%`}
                    </b>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>
<ProductsScreener products={screenerProducts} />
    </main>
  );
}