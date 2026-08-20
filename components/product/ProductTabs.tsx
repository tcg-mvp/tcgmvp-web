"use client";

import { useState } from "react";

import CurrentListings from "@/components/product/CurrentListings";
import PriceChart from "@/components/PriceChart";
import RecentSales from "@/components/product/RecentSales";
import MarketSnapshot from "@/components/product/MarketSnapshot";

type PriceHistoryEntry = {
  price: number;
  recorded_at: string;
};

type MarketSale = {
  id: number;
  marketplace: string;
  title: string;
  sale_price: number | string;
  shipping_price: number | string | null;
  total_price: number | string | null;
  sale_type: string | null;
  sold_at: string;
  listing_url: string | null;
  is_verified: boolean;
};

type MarketListing = {
  id: number;
  marketplace: string;
  title: string;
  listing_price: number | string;
  shipping_price: number | string | null;
  total_price: number | string | null;
  listing_type: string | null;
  seller_name: string | null;
  seller_feedback: number | string | null;
  listing_url: string | null;
  listed_at: string | null;
  last_seen: string | null;
};

type ProductTabsProps = {
  priceHistory: PriceHistoryEntry[];
  sales: MarketSale[];
  listings: MarketListing[];
};

type TabId = "performance" | "sales" | "listings" | "snapshot";

const tabs: { id: TabId; label: string }[] = [
  {
    id: "performance",
    label: "Market Performance",
  },
  {
    id: "sales",
    label: "Recent Sales",
  },
  {
    id: "listings",
    label: "Current Listings",
  },
  {
    id: "snapshot",
    label: "Market Snapshot",
  },
];

export default function ProductTabs({
  priceHistory,
  sales,
  listings,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] =
    useState<TabId>("performance");

  return (
    <section className="product-tabs-section">
      <div className="container">
        <div className="product-tabs-shell">
          <div
            className="product-tabs-navigation"
            role="tablist"
            aria-label="Product market information"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={
                  activeTab === tab.id
                    ? "product-tab-button active"
                    : "product-tab-button"
                }
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}

                {tab.id === "sales" && (
                  <span>{sales.length}</span>
                )}

                {tab.id === "listings" && (
                  <span>{listings.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="product-tab-content">
            {activeTab === "performance" && (
              <div
                role="tabpanel"
                className="product-tab-panel"
              >
                <div className="product-tab-heading">
                  <div>
                    <span className="section-kicker">
                      Price history
                    </span>
                    <h2>Market performance</h2>
                  </div>
                </div>

                <PriceChart data={priceHistory} />
              </div>
            )}

            {activeTab === "sales" && (
              <div
                role="tabpanel"
                className="product-tab-panel"
              >
                <RecentSales sales={sales} />
              </div>
            )}

            {activeTab === "listings" && (
              <div
                role="tabpanel"
                className="product-tab-panel"
              >
                <CurrentListings listings={listings} />
              </div>
            )}

            {activeTab === "snapshot" && (
              <div
                role="tabpanel"
                className="product-tab-panel"
              >
                <MarketSnapshot
                  sales={sales}
                  listings={listings}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}