"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";

export type ScreenerProduct = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  productType: string;
  language: string;
  series: string;
  marketPrice: number | null;
  change30d: number | null;
};

type ProductsScreenerProps = {
  products: ScreenerProduct[];
};

type SortOption =
  | "name-asc"
  | "price-desc"
  | "price-asc"
  | "change-desc"
  | "change-asc";

function createOptions(
  products: ScreenerProduct[],
  field: "series" | "language" | "productType"
): string[] {
  return Array.from(
    new Set(
      products
        .map((product) => product[field])
        .filter((value) => value.trim().length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export default function ProductsScreener({
  products,
}: ProductsScreenerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedProductType, setSelectedProductType] =
    useState("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("name-asc");

  const seriesOptions = useMemo(
    () => createOptions(products, "series"),
    [products]
  );

  const languageOptions = useMemo(
    () => createOptions(products, "language"),
    [products]
  );

  const productTypeOptions = useMemo(
    () => createOptions(products, "productType"),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.series.toLowerCase().includes(normalizedSearch) ||
        product.productType
          .toLowerCase()
          .includes(normalizedSearch) ||
        product.language.toLowerCase().includes(normalizedSearch);

      const matchesSeries =
        selectedSeries === "all" ||
        product.series === selectedSeries;

      const matchesLanguage =
        selectedLanguage === "all" ||
        product.language === selectedLanguage;

      const matchesProductType =
        selectedProductType === "all" ||
        product.productType === selectedProductType;

      return (
        matchesSearch &&
        matchesSeries &&
        matchesLanguage &&
        matchesProductType
      );
    });

    return [...filteredProducts].sort((a, b) => {
      switch (sortOption) {
        case "price-desc":
          return (
            (b.marketPrice ?? Number.NEGATIVE_INFINITY) -
            (a.marketPrice ?? Number.NEGATIVE_INFINITY)
          );

        case "price-asc":
          return (
            (a.marketPrice ?? Number.POSITIVE_INFINITY) -
            (b.marketPrice ?? Number.POSITIVE_INFINITY)
          );

        case "change-desc":
          return (
            (b.change30d ?? Number.NEGATIVE_INFINITY) -
            (a.change30d ?? Number.NEGATIVE_INFINITY)
          );

        case "change-asc":
          return (
            (a.change30d ?? Number.POSITIVE_INFINITY) -
            (b.change30d ?? Number.POSITIVE_INFINITY)
          );

        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [
    products,
    searchQuery,
    selectedSeries,
    selectedLanguage,
    selectedProductType,
    sortOption,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSeries !== "all" ||
    selectedLanguage !== "all" ||
    selectedProductType !== "all" ||
    sortOption !== "name-asc";

  function clearFilters() {
    setSearchQuery("");
    setSelectedSeries("all");
    setSelectedLanguage("all");
    setSelectedProductType("all");
    setSortOption("name-asc");
  }

  return (
    <section className="section product-showcase-section">
      <div className="container">
        <div className="section-heading products-screener-heading">
          <div>
            <span className="section-kicker">Market watch</span>
            <h2>Tracked sealed products.</h2>
          </div>

          <p>
            Search, filter, and sort the sealed-product market before
            opening a full TCGMVP research report.
          </p>
        </div>

        <div
          className="products-screener"
          aria-label="Product market controls"
        >
          <div className="products-screener-search">
            <label htmlFor="product-market-search">
              Search the market
            </label>

            <div className="products-screener-search-input">
              <span aria-hidden="true">⌕</span>

              <input
                id="product-market-search"
                type="search"
                placeholder="Search by product, series, or type"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
              />
            </div>
          </div>

          <div className="products-screener-controls">
            <label>
              <span>Series</span>

              <select
                value={selectedSeries}
                onChange={(event) =>
                  setSelectedSeries(event.target.value)
                }
              >
                <option value="all">All series</option>

                {seriesOptions.map((series) => (
                  <option value={series} key={series}>
                    {series}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Language</span>

              <select
                value={selectedLanguage}
                onChange={(event) =>
                  setSelectedLanguage(event.target.value)
                }
              >
                <option value="all">All languages</option>

                {languageOptions.map((language) => (
                  <option value={language} key={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Product type</span>

              <select
                value={selectedProductType}
                onChange={(event) =>
                  setSelectedProductType(event.target.value)
                }
              >
                <option value="all">All product types</option>

                {productTypeOptions.map((productType) => (
                  <option value={productType} key={productType}>
                    {productType}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Sort by</span>

              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target.value as SortOption
                  )
                }
              >
                <option value="name-asc">
                  Product name
                </option>

                <option value="price-desc">
                  Price: highest first
                </option>

                <option value="price-asc">
                  Price: lowest first
                </option>

                <option value="change-desc">
                  30-day movement: highest
                </option>

                <option value="change-asc">
                  30-day movement: lowest
                </option>
              </select>
            </label>
          </div>

          <div className="products-screener-status">
            <p aria-live="polite">
              Showing{" "}
              <strong>{visibleProducts.length}</strong>{" "}
              of <strong>{products.length}</strong>{" "}
              {products.length === 1 ? "product" : "products"}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              Clear filters
            </button>
          </div>
        </div>

        {visibleProducts.length > 0 ? (
          <div className="product-showcase">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                slug={product.slug}
                image_url={product.imageUrl}
                productType={product.productType}
                language={product.language}
                series={product.series}
                marketPrice={product.marketPrice}
                change30d={product.change30d}
              />
            ))}
          </div>
        ) : (
          <div className="products-screener-empty">
            <span>No matching products</span>

            <h3>Adjust your market criteria.</h3>

            <p>
              No tracked products match the current search and filter
              combination.
            </p>

            <button type="button" onClick={clearFilters}>
              Reset market filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}