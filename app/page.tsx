"use client";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const features = [
  {
    title: "Historical pricing",
    description:
      "Track verified sales history, price movement, and long-term market direction across sealed TCG products.",
    metric: "12M+",
    label: "market observations",
    icon: "chart",
  },
  {
    title: "Deal intelligence",
    description:
      "Compare any listing against market value, recent sales, liquidity, and confidence before you buy.",
    metric: "92",
    label: "sample deal score",
    icon: "spark",
  },
  {
    title: "Liquidity insights",
    description:
      "Understand how quickly products move, how deep demand is, and how reliable the current price really is.",
    metric: "High",
    label: "sample liquidity",
    icon: "pulse",
  },
];

const steps = [
  {
    number: "01",
    title: "Search any product",
    description:
      "Find English Pokémon booster boxes, elite trainer boxes, premium collections, and more.",
  },
  {
    number: "02",
    title: "Read the market",
    description:
      "Review recent sales, trend direction, volatility, liquidity, and confidence in one place.",
  },
  {
    number: "03",
    title: "Make the decision",
    description:
      "Use the deal score and market context to decide whether to buy, hold, sell, or wait.",
  },
];

const faqs = [
  {
    question: "What is TCGMVP?",
    answer:
      "TCGMVP is a trading card market intelligence platform built to help collectors and investors understand pricing, liquidity, trends, and deal quality.",
  },
  {
    question: "Which products will be supported first?",
    answer:
      "The initial focus is English Pokémon sealed products, beginning with booster boxes and other high-interest sealed items.",
  },
  {
    question: "When will the beta launch?",
    answer:
      "The product is currently in development. Beta users will be invited in stages as core market data and deal analysis features become available.",
  },
];
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
type FeaturedProduct = {
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
  product_price_history: PriceHistoryEntry[] | null;
};
function Icon({ type }: { type: string }) {
  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />
      </svg>
    );
  }

  if (type === "spark") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
        <path d="m18.5 15 .9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

export default function Home() {
  const shellRef = useRef<HTMLElement>(null);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [featuredProductsLoading, setFeaturedProductsLoading] = useState(true);
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell) return;

      shell.style.setProperty("--pointer-x", `${event.clientX}px`);
      shell.style.setProperty("--pointer-y", `${event.clientY}px`);
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function loadFeaturedProducts() {
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
          product_price_history (
            price,
            recorded_at
          )
        `)
        .eq("active", true)
        .in("slug", [
          "evolving-skies-booster-box-english",
          "chilling-reign-booster-box-english",
          "team-up-booster-box-english"
        ]);

      if (error) {
        console.error("Featured products error:", error);
        setFeaturedProductsLoading(false);
        return;
      }

      setFeaturedProducts((data ?? []) as FeaturedProduct[]);
      setFeaturedProductsLoading(false);
    }

    loadFeaturedProducts();
  }, []);
      const evolvingSkies = featuredProducts.find(
      (product) =>
        product.slug === "evolving-skies-booster-box-english"
    );

    const evolvingSkiesMarketData = evolvingSkies
      ? calculateMarketData(
          evolvingSkies.product_price_history ?? []
        )
      : {
          marketPrice: null,
          change30d: null,
        };
  return (
    <main ref={shellRef} className="site-shell">
      <div className="mesh-background" aria-hidden="true">
        <span className="mesh-orb mesh-orb-one" />
        <span className="mesh-orb mesh-orb-two" />
        <span className="mesh-orb mesh-orb-three" />
      </div>
      <div className="cursor-light" aria-hidden="true" />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="nav-wrap">
        <nav className="nav container">
          <a className="brand" href="#top" aria-label="TCGMVP home">
            <Image
              src="/tcgmvp-mark.png"
              alt=""
              width={48}
              height={48}
              className="brand-logo"
              priority
            />
            <span>TCGMVP</span>
          </a>

          <div className="nav-links">
          <Link href="/products">Market</Link>
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
        </div>

          <a
            className="button button-small button-primary"
            href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
          >
            Join beta
            <span>↗</span>
          </a>
        </nav>
      </header>

      <section id="top" className="hero container">
        <div className="hero-copy reveal" data-reveal>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            Built for serious collectors and investors
          </div>

          <h1>
            The market intelligence layer for{" "}
            <span className="gradient-text">trading cards.</span>
          </h1>

          <p className="hero-lead">
            Historical pricing, liquidity, trend analysis, and deal intelligence
            in one premium platform built for smarter TCG decisions.
          </p>

          <div className="hero-actions">
            <a
              className="button button-primary"
              href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
            >
              Join the beta
              <span>↗</span>
            </a>
            <Link className="button button-secondary" href="/products">
              Explore the market
            </Link>
          </div>

          <div className="hero-proof">
            <div>
              <strong>English Pokémon</strong>
              <span>Initial market focus</span>
            </div>
            <div>
              <strong>Data-first</strong>
              <span>Built around market evidence</span>
            </div>
            <div>
              <strong>Collector-led</strong>
              <span>Designed from real buying workflows</span>
            </div>
          </div>
        </div>

        <div className="hero-visual reveal delay-1" data-reveal>
          <div className="dashboard-glow" />
          <div className="dashboard-window">
            <div className="scan-line" aria-hidden="true" />
            <div className="window-topbar">
              <div className="window-dots">
                <span />
                <span />
                <span />
              </div>
              <div className="window-search">Search sealed products...</div>
              <div className="window-avatar">YN</div>
            </div>

            <div className="dashboard-body">
              <aside className="dashboard-sidebar">
                <div className="side-logo">M</div>
                <div className="side-item active" />
                <div className="side-item" />
                <div className="side-item" />
                <div className="side-item" />
              </aside>

              <div className="dashboard-main">
                <div className="product-heading">
                  <div>
                    <span className="mini-label">Pokémon · Sword & Shield</span>
                    <h2>Evolving Skies Booster Box</h2>
                  </div>
                  <span className="status-pill">Live market</span>
                </div>

                <div className="metric-grid">
                  <div className="metric-card">
                    <span>Market value</span>
                    <strong>$2,487</strong>
                    <small className="positive">+7.2% in 30 days</small>
                  </div>
                  
                  <div className="metric-card">
                    <span>Deal score</span>
                    <strong>92/100</strong>
                    <small>Strong buy range</small>
                  </div>
                  <div className="metric-card">
                    <span>Liquidity</span>
                    <strong>High</strong>
                    <small>Consistent buyer demand</small>
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-heading">
                    <div>
                      <span>Market trend</span>
                      <strong>12-month performance</strong>
                    </div>
                    <div className="chart-tabs">
                      <span>1M</span>
                      <span>3M</span>
                      <span className="active">1Y</span>
                    </div>
                  </div>

                  <div className="chart-area">
                    <div className="chart-grid-lines" />
                    <svg viewBox="0 0 560 210" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        className="chart-fill"
                        d="M0 184 C55 169 72 151 112 158 C151 165 171 121 214 127 C260 134 271 91 318 97 C362 104 375 73 421 82 C470 91 494 47 560 32 L560 210 L0 210 Z"
                      />
                      <path
                        className="chart-line"
                        d="M0 184 C55 169 72 151 112 158 C151 165 171 121 214 127 C260 134 271 91 318 97 C362 104 375 73 421 82 C470 91 494 47 560 32"
                      />
                    </svg>
                  </div>
                </div>

                <div className="dashboard-footer-row">
                  <div>
                    <span>Recent verified sale</span>
                    <strong>$2,525</strong>
                  </div>
                  <div>
                    <span>30-day volume</span>
                    <strong>38 sales</strong>
                  </div>
                  <div>
                    <span>Confidence</span>
                    <strong>97%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-left">
            <span>Deal detected</span>
            <strong>8.4% below market</strong>
          </div>

          <div className="floating-card floating-card-right">
            <span>Momentum</span>
            <strong className="positive">Bullish ↗</strong>
          </div>
        </div>
      </section>

      <section className="proof-strip">
        <div className="container proof-strip-inner">
          <span>Designed for</span>
          <strong>Collectors</strong>
          <strong>Investors</strong>
          <strong>Card shops</strong>
          <strong>Market researchers</strong>
        </div>
      </section>


      <section className="market-ticker" aria-label="Current market movement">
        <div className="ticker-track">
          {[0, 1].map((group) => (
            <div className="ticker-group" key={group}>
              {featuredProducts.map((product) => {
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
                        : `${change30d >= 0 ? "+" : ""}${change30d.toFixed(
                            2
                          )}%`}
                    </b>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="section container">
        <div className="section-heading reveal" data-reveal>
          <div>
            <span className="section-kicker">The platform</span>
            <h2>Read the market before you make the move.</h2>
          </div>
          <p>
            TCGMVP brings the market context scattered across listings, sold
            data, spreadsheets, and collector communities into one clear
            decision system.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article
              className={`feature-card reveal delay-${index}`}
              data-reveal
              key={feature.title}
            >
              <div className="feature-icon">
                <Icon type={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-metric">
                <strong>{feature.metric}</strong>
                <span>{feature.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section className="section product-showcase-section">
        <div className="container">
          <div className="section-heading reveal" data-reveal>
            <div>
              <span className="section-kicker">Market watch</span>
              <h2>See the products moving the market.</h2>
            </div>
            <p>
              Product pages combine current value, historical movement, demand,
              sale velocity, and deal quality into one focused view.
            </p>
          </div>

         <div className="product-showcase">
            {featuredProductsLoading ? (
              <div className="featured-products-loading">
                Loading featured products...
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="featured-products-loading">
                Featured products are not available yet.
              </div>
            ) : (
              featuredProducts.map((product) => {
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
              })
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section process-section">
        <div className="container">
          <div className="section-heading narrow reveal" data-reveal>
            <div>
              <span className="section-kicker">How it works</span>
              <h2>From listing to decision in seconds.</h2>
            </div>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <article
                className={`process-card reveal delay-${index}`}
                data-reveal
                key={step.number}
              >
                <span className="process-number">{step.number}</span>
                <div className="process-line" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section container">
        <div className="insight-panel reveal" data-reveal>
          <div className="insight-copy">
            <span className="section-kicker">Built differently</span>
            <h2>Not another price guide.</h2>
            <p>
              A market price alone does not tell you whether a product is
              liquid, overpriced, volatile, manipulated, or moving with
              conviction. TCGMVP is being built to explain the market behind
              the number.
            </p>

            <div className="check-list">
              <span>Verified sales context</span>
              <span>Liquidity and demand signals</span>
              <span>Trend and volatility analysis</span>
              <span>Transparent confidence scoring</span>
            </div>
          </div>

          <div className="signal-stack">
            <div className="signal-card">
              <span>Price confidence</span>
              <strong>97%</strong>
              <div className="progress">
                <span style={{ width: "97%" }} />
              </div>
            </div>
            <div className="signal-card">
              <span>Buyer demand</span>
              <strong>High</strong>
              <div className="bars">
                <i />
                <i />
                <i />
                <i />
                <i className="muted" />
              </div>
            </div>
            <div className="signal-card">
              <span>Market direction</span>
              <strong className="positive">Upward</strong>
              <small>Momentum strengthening</small>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="section container">
        <div className="faq-layout">
          <div className="faq-intro reveal" data-reveal>
            <span className="section-kicker">FAQ</span>
            <h2>Questions before the beta?</h2>
            <p>
              TCGMVP is currently being built in public stages. Here is what the
              first version is designed to deliver.
            </p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <details
                className={`faq-item reveal delay-${index}`}
                data-reveal
                key={faq.question}
              >
                <summary>
                  {faq.question}
                  <span>+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section container reveal" data-reveal>
        <div className="cta-inner">
          <div className="cta-glow" />
          <span className="section-kicker">Early access</span>
          <h2>Become a smarter collector.</h2>
          <p>
            Join the TCGMVP beta and help shape the market intelligence platform
            built for the next generation of collectors.
          </p>
          <a
            className="button button-primary"
            href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
          >
            Request beta access
            <span>↗</span>
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="brand">
            <Image
              src="/tcgmvp-mark.png"
              alt=""
              width={48}
              height={48}
              className="brand-logo"
            />
            <span>TCGMVP</span>
          </div>
          <p>Trading card market intelligence.</p>
          <span>© 2026 TCGMVP</span>
        </div>
      </footer>
    </main>
  );
}
