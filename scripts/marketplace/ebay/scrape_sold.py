from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from playwright.sync_api import Locator, sync_playwright


OUTPUT_FILE = Path(__file__).with_name("ebay_sold_debug.json")
SCREENSHOT_FILE = Path(__file__).with_name("ebay_sold_debug.png")
HTML_FILE = Path(__file__).with_name("ebay_sold_debug.html")


def safe_text(locator: Locator) -> str | None:
    if locator.count() == 0:
        return None

    try:
        return locator.first.inner_text().strip()
    except Exception:
        return None


def safe_attribute(locator: Locator, attribute: str) -> str | None:
    if locator.count() == 0:
        return None

    try:
        return locator.first.get_attribute(attribute)
    except Exception:
        return None


def scrape_ebay_sold(url: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    with sync_playwright() as playwright:
        profile_directory = Path(__file__).with_name("ebay_browser_profile")

        context = playwright.chromium.launch_persistent_context(
            user_data_dir=str(profile_directory),
            headless=False,
            locale="en-US",
            viewport={
                "width": 1440,
                "height": 1000,
            },
        )

        page = context.pages[0] if context.pages else context.new_page()
        page.set_default_timeout(30_000)

        try:
            print("Opening eBay sold-results page...")

            response = page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=60_000,
            )

            if response is None:
                raise RuntimeError("eBay did not return a page response.")

            print(f"HTTP status: {response.status}")
            print(f"Page title: {page.title()}")
            print(f"Current URL: {page.url}")

            page.wait_for_timeout(3_000)

            requires_login = (
                "signin" in page.url.lower()
                or "sign in" in page.title().lower()
                or "register" in page.title().lower()
            )

            if requires_login:
                print("")
                print("eBay requires authentication for sold listings.")
                print("Sign into eBay manually in the opened browser window.")
                print("After signing in, make sure the sold-results page is visible.")
                print("Do not close the browser window.")

                input(
                    "When the sold listings are visible, return here and press Enter... "
                )

                print("Reloading the sold-results URL...")

                response = page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=60_000,
                )

                if response is None:
                    raise RuntimeError(
                        "eBay did not return a response after login."
                    )

                page.wait_for_timeout(5_000)

                print(f"Authenticated HTTP status: {response.status}")
                print(f"Authenticated page title: {page.title()}")
                print(f"Authenticated URL: {page.url}")

            else:
                page.wait_for_timeout(5_000)

            page.screenshot(
                path=str(SCREENSHOT_FILE),
                full_page=True,
            )

            HTML_FILE.write_text(
                page.content(),
                encoding="utf-8",
            )

            cards = page.locator("li.s-item")
            card_count = cards.count()

            print(f"Potential listing cards found: {card_count}")

            for index in range(min(card_count, 25)):
                card = cards.nth(index)

                title = safe_text(card.locator(".s-item__title"))
                price = safe_text(card.locator(".s-item__price"))
                shipping = safe_text(card.locator(".s-item__shipping"))
                date_text = safe_text(
                    card.locator(".s-item__caption-section")
                )
                listing_url = safe_attribute(
                    card.locator("a.s-item__link"),
                    "href",
                )

                if not title:
                    continue

                if title.lower() == "shop on ebay":
                    continue

                results.append(
                    {
                        "title": title,
                        "price": price,
                        "shipping": shipping,
                        "date_text": date_text,
                        "listing_url": listing_url,
                    }
                )

            print("")
            print(f"Extracted listings in memory: {len(results)}")
            input("Press Enter to close the browser... ")

        finally:
            context.close()

    return results


def main() -> None:
    if len(sys.argv) != 2:
        print(
            'Usage: python scrape_sold.py '
            '"FULL_EBAY_SOLD_RESULTS_URL"'
        )
        raise SystemExit(1)

    sold_url = sys.argv[1]

    listings = scrape_ebay_sold(sold_url)

    OUTPUT_FILE.write_text(
        json.dumps(
            listings,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print(f"Extracted listings: {len(listings)}")
    print(f"JSON saved to: {OUTPUT_FILE}")
    print(f"Screenshot saved to: {SCREENSHOT_FILE}")
    print(f"HTML saved to: {HTML_FILE}")


if __name__ == "__main__":
    main()