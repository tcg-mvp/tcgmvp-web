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

  return (
    <main className="min-h-screen bg-[#07111f] px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            TCGMVP Market
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Sealed Products
          </h1>

          <p className="mt-4 max-w-2xl text-white/60">
            Explore tracked Pokémon sealed products and their latest market
            performance.
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h2 className="text-xl font-semibold">No products found</h2>

            <p className="mt-2 text-white/60">
              Your database connected successfully, but no active products were
              returned.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const setData = Array.isArray(product.sets)
                ? product.sets[0]
                : product.sets;

              const seriesData = Array.isArray(setData?.series)
                ? setData?.series[0]
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
        )}
      </div>
    </main>
  );
}