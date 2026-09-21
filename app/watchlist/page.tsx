"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import SiteHeader from "@/components/layout/SiteHeader";
import ProductCard from "@/components/product/ProductCard";

import { supabase } from "@/lib/supabase";

import {
  WATCHLIST_CHANGED_EVENT,
  WATCHLIST_STORAGE_KEY,
  getWatchlist,
} from "@/lib/watchlist";

type WatchlistProduct = {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;

  sets:
    | {
        name: string;
        series:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }
    | {
        name: string;
        series:
          | {
              name: string;
            }
          | {
              name: string;
            }[]
          | null;
      }[]
    | null;

  languages:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  product_types:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  product_market_summary:
    | {
        current_market_price: number | null;
        change_30d_percent: number | null;
      }
    | {
        current_market_price: number | null;
        change_30d_percent: number | null;
      }[]
    | null;
};

export default function WatchlistPage() {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<WatchlistProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSavedSlugs = useCallback(() => {
    setSavedSlugs(getWatchlist());
  }, []);

  useEffect(() => {
    refreshSavedSlugs();
    setHydrated(true);

    function handleStorage(event: StorageEvent) {
      if (
        event.key === null ||
        event.key === WATCHLIST_STORAGE_KEY
      ) {
        refreshSavedSlugs();
      }
    }

    window.addEventListener(
      WATCHLIST_CHANGED_EVENT,
      refreshSavedSlugs
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        WATCHLIST_CHANGED_EVENT,
        refreshSavedSlugs
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [refreshSavedSlugs]);

  useEffect(() => {
    async function loadWatchlistProducts() {
      if (!hydrated) {
        return;
      }

      if (savedSlugs.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
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
        .in("slug", savedSlugs);

      if (error) {
        console.error(
          "Unable to load watchlist products:",
          error.message
        );

        setProducts([]);
        setLoading(false);
        return;
      }

      const loadedProducts =
        (data ?? []) as WatchlistProduct[];

      const productOrder = new Map(
        savedSlugs.map((slug, index) => [
          slug,
          index,
        ])
      );

      loadedProducts.sort(
        (a, b) =>
          (productOrder.get(a.slug) ?? 9999) -
          (productOrder.get(b.slug) ?? 9999)
      );

      setProducts(loadedProducts);
      setLoading(false);
    }

    loadWatchlistProducts();
  }, [hydrated, savedSlugs]);

  return (
    <main className="site-shell products-page watchlist-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <SiteHeader watchlistPage />

      <section className="watchlist-hero container">
        <span className="section-kicker">
          My Market
        </span>

        <h1>Your Watchlist</h1>

        <p>
          Keep the sealed products you care about in one
          focused market view.
        </p>

        <div className="watchlist-beta-note">
          <span>Beta</span>

          Watchlist selections are currently saved on this
          device.
        </div>
      </section>

      <section className="watchlist-content container">
        {!hydrated || loading ? (
          <div className="watchlist-state">
            <span className="section-kicker">
              Loading
            </span>

            <h2>Loading your watchlist...</h2>
          </div>
        ) : products.length === 0 ? (
          <div className="watchlist-state">
            <span className="section-kicker">
              Watchlist
            </span>

            <h2>Your watchlist is empty.</h2>

            <p>
              Save products from the market to keep the
              products you care about in one place.
            </p>

            <Link
              href="/products"
              className="button button-primary"
            >
              Explore the market
              <span>→</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="watchlist-summary">
              <div>
                <span>Products tracked</span>
                <strong>{products.length}</strong>
              </div>

              <p>
                Current market values refresh from the same
                live product data used throughout TCGMVP.
              </p>
            </div>

            <div className="product-showcase watchlist-grid">
              {products.map((product) => {
                const setData = Array.isArray(
                  product.sets
                )
                  ? product.sets[0]
                  : product.sets;

                const seriesData = Array.isArray(
                  setData?.series
                )
                  ? setData.series[0]
                  : setData?.series;

                const languageData = Array.isArray(
                  product.languages
                )
                  ? product.languages[0]
                  : product.languages;

                const productTypeData = Array.isArray(
                  product.product_types
                )
                  ? product.product_types[0]
                  : product.product_types;

                const marketSummary = Array.isArray(
                  product.product_market_summary
                )
                  ? product.product_market_summary[0]
                  : product.product_market_summary;

                const marketPrice =
                  marketSummary?.current_market_price !==
                    null &&
                  marketSummary?.current_market_price !==
                    undefined
                    ? Number(
                        marketSummary.current_market_price
                      )
                    : null;

                const change30d =
                  marketSummary?.change_30d_percent !==
                    null &&
                  marketSummary?.change_30d_percent !==
                    undefined
                    ? Number(
                        marketSummary.change_30d_percent
                      )
                    : null;

                return (
                  <ProductCard
                    key={product.id}
                    name={product.name}
                    slug={product.slug}
                    image_url={product.image_url}
                    productType={
                      productTypeData?.name ??
                      "Sealed Product"
                    }
                    language={
                      languageData?.name ?? "Unknown"
                    }
                    series={
                      seriesData?.name ??
                      "Unknown Series"
                    }
                    marketPrice={marketPrice}
                    change30d={change30d}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}