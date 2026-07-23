import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
type PriceHistoryEntry = {
  price: number | string;
  recorded_at: string;
};

function calculateMarketData(priceHistory: PriceHistoryEntry[]) {
  if (!priceHistory || priceHistory.length === 0) {
    return {
      marketPrice: null,
      change30d: null,
    };
  }

  const sortedHistory = [...priceHistory].sort(
    (a, b) =>
      new Date(a.recorded_at).getTime() -
      new Date(b.recorded_at).getTime()
  );

  const latestEntry = sortedHistory[sortedHistory.length - 1];
  const latestPrice = Number(latestEntry.price);
  const latestDate = new Date(latestEntry.recorded_at);

  const targetDate = new Date(latestDate);
  targetDate.setDate(targetDate.getDate() - 30);

  const olderEntries = sortedHistory.filter(
    (entry) => new Date(entry.recorded_at) <= targetDate
  );

  const thirtyDayEntry =
    olderEntries.length > 0
      ? olderEntries[olderEntries.length - 1]
      : null;

  const thirtyDayPrice = thirtyDayEntry
    ? Number(thirtyDayEntry.price)
    : null;

  const change30d =
    thirtyDayPrice !== null && thirtyDayPrice > 0
      ? ((latestPrice - thirtyDayPrice) / thirtyDayPrice) * 100
      : null;

  return {
    marketPrice: latestPrice,
    change30d,
  };
}
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
      product_price_history (
        price,
        recorded_at
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
                width={38}
                height={38}
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
                const { change30d } = calculateMarketData(
                  product.product_price_history ?? []
                );
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

              const { marketPrice, change30d } = calculateMarketData(
                product.product_price_history ?? []
              );
              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  slug={product.slug}
                  image_url={product.image_url}
                  productType={productTypeData?.name ?? "Sealed Product"}
                  language={languageData?.name ?? "Unknown"}
                  series={seriesData?.name ?? "Unknown Series"}
                  marketPrice={marketPrice}
                  change30d={change30d}
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}