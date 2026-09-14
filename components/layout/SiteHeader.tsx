"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SiteHeaderProps = {
  productsPage?: boolean;
  detailPage?: boolean;
};

export default function SiteHeader({
  productsPage = false,
  detailPage = false,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const isHome = pathname === "/";
  const isMarket = pathname.startsWith("/products");

  return (
    <header className="nav-wrap">
      <nav className="nav container">
        <Link
          className="brand"
          href="/"
          aria-label="TCGMVP home"
          onClick={closeMobileMenu}
        >
          <Image
            src="/tcgmvp-mark.png"
            alt=""
            width={48}
            height={48}
            className="brand-logo"
            priority
          />

          <span>TCGMVP</span>
        </Link>

        <div className="nav-links">
          <Link
            href="/"
            aria-current={isHome ? "page" : undefined}
          >
            Home
          </Link>

          <Link
            href="/products"
            aria-current={isMarket ? "page" : undefined}
          >
            Market
          </Link>

          <Link href="/#platform">
            Platform
          </Link>

          <Link href="/#how-it-works">
            How it works
          </Link>

          <Link href="/#about">
            About
          </Link>
        </div>

        <div className="nav-actions">
          {detailPage ? (
            <Link
              className="button button-small button-primary desktop-beta-button"
              href="/products"
            >
              Back to market
              <span>↗</span>
            </Link>
          ) : productsPage ? (
            <Link
              className="button button-small button-primary desktop-beta-button"
              href="/"
            >
              Back to home
              <span>↗</span>
            </Link>
          ) : (
            <a
              className="button button-small button-primary desktop-beta-button"
              href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
            >
              Join beta
              <span>↗</span>
            </a>
          )}

          <button
            type="button"
            className={`mobile-menu-button ${
              mobileMenuOpen ? "is-open" : ""
            }`}
            aria-label={
              mobileMenuOpen
                ? "Close navigation"
                : "Open navigation"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() =>
              setMobileMenuOpen((current) => !current)
            }
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`mobile-nav-panel ${
          mobileMenuOpen ? "is-open" : ""
        }`}
      >
        <div className="container mobile-nav-panel-inner">
          <Link
            href="/"
            onClick={closeMobileMenu}
          >
            Home
          </Link>

          <Link
            href="/products"
            onClick={closeMobileMenu}
          >
            Market
          </Link>

          <Link
            href="/#platform"
            onClick={closeMobileMenu}
          >
            Platform
          </Link>

          <Link
            href="/#how-it-works"
            onClick={closeMobileMenu}
          >
            How it works
          </Link>

          <Link
            href="/#about"
            onClick={closeMobileMenu}
          >
            About
          </Link>

          <Link
            href="/#faq"
            onClick={closeMobileMenu}
          >
            FAQ
          </Link>

          {detailPage ? (
            <Link
              className="button button-primary mobile-nav-beta"
              href="/products"
              onClick={closeMobileMenu}
            >
              Back to market
              <span>↗</span>
            </Link>
          ) : productsPage ? (
            <Link
              className="button button-primary mobile-nav-beta"
              href="/"
              onClick={closeMobileMenu}
            >
              Back to home
              <span>↗</span>
            </Link>
          ) : (
            <a
              className="button button-primary mobile-nav-beta"
              href="mailto:tcgmvpplaceholder@gmail.com?subject=TCGMVP Beta Interest"
              onClick={closeMobileMenu}
            >
              Join the beta
              <span>↗</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}