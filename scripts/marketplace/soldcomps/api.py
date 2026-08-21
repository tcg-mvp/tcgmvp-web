from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env.local")


SOLDCOMPS_API_URL = (
    "https://api.sold-comps.com/v1/scrape"
)

MAX_ATTEMPTS = 3

RETRYABLE_STATUS_CODES = {
    429,
    500,
    502,
    503,
    504,
}


def get_soldcomps_api_key() -> str:
    api_key = os.getenv(
        "SOLDCOMPS_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "SOLDCOMPS_API_KEY is missing "
            "from the environment."
        )

    return api_key


def _response_indicates_quota_exhaustion(
    response: requests.Response,
) -> bool:
    """
    Detect monthly / usage quota exhaustion so
    we fail immediately instead of retrying.

    Temporary 429 rate limits are still allowed
    to use the normal retry path.
    """
    body = (
        response.text
        or ""
    ).lower()

    quota_phrases = (
        "quota_exceeded",
        "quota exceeded",
        "monthly quota",
        "monthly limit",
        "request quota",
        "usage limit",
        "quota reached",
        "quota exhausted",
    )

    return any(
        phrase in body
        for phrase in quota_phrases
    )


def search_sold_listings(
    *,
    keyword: str,
    ebay_site: str = "ebay.com",
    count: int = 200,
    page: int = 1,
    sold_after: str | None = None,
) -> dict[str, Any]:
    """
    Fetch one page of SoldComps completed
    eBay results.
    """
    if count < 1 or count > 200:
        raise ValueError(
            "count must be between 1 and 200."
        )

    if page < 1:
        raise ValueError(
            "page must be at least 1."
        )

    api_key = get_soldcomps_api_key()

    params: dict[str, Any] = {
        "keyword": keyword,
        "ebaySite": ebay_site,
        "count": count,
        "page": page,
        "sortOrder": "endedRecently",
        "sold": "true",
        "exactMatch": "true",
        "includeCompleteListing": "true",
    }

    if sold_after:
        params["soldAfter"] = sold_after

    last_error: RuntimeError | None = None

    for attempt in range(
        1,
        MAX_ATTEMPTS + 1,
    ):
        try:
            response = requests.get(
                SOLDCOMPS_API_URL,
                headers={
                    "Authorization": (
                        f"Bearer {api_key}"
                    ),
                },
                params=params,
                timeout=60,
            )

        except requests.RequestException as exc:
            last_error = RuntimeError(
                "SoldComps API request "
                "failed with network error: "
                f"{exc}"
            )

            if attempt == MAX_ATTEMPTS:
                raise last_error

            wait_seconds = (
                2 ** (attempt - 1)
            )

            print(
                "SoldComps request failed "
                "with network error. "
                f"Retrying in "
                f"{wait_seconds}s..."
            )

            time.sleep(
                wait_seconds
            )

            continue

        if response.ok:
            payload = response.json()

            if not isinstance(
                payload,
                dict,
            ):
                raise RuntimeError(
                    "SoldComps API returned "
                    "an unexpected response "
                    "format."
                )

            return payload

        if (
            response.status_code == 429
            and _response_indicates_quota_exhaustion(
                response
            )
        ):
            raise RuntimeError(
                "SoldComps monthly/API quota "
                "appears to be exhausted.\n"
                f"Status: "
                f"{response.status_code}\n"
                f"Response: "
                f"{response.text}"
            )

        error = RuntimeError(
            "SoldComps API request failed.\n"
            f"Status: "
            f"{response.status_code}\n"
            f"Response: "
            f"{response.text}"
        )

        last_error = error

        if (
            response.status_code
            not in RETRYABLE_STATUS_CODES
            or attempt == MAX_ATTEMPTS
        ):
            raise error

        wait_seconds = (
            2 ** (attempt - 1)
        )

        print(
            "SoldComps temporary error "
            f"{response.status_code}. "
            f"Retrying in "
            f"{wait_seconds}s..."
        )

        time.sleep(
            wait_seconds
        )

    if last_error:
        raise last_error

    raise RuntimeError(
        "SoldComps request failed "
        "without a captured error."
    )


def search_all_sold_listings(
    *,
    keyword: str,
    ebay_site: str = "ebay.com",
    count_per_page: int = 200,
    max_pages: int = 5,
    sold_after: str | None = None,
) -> dict[str, Any]:
    """
    Fetch multiple SoldComps pages and
    combine them.

    Results are deduplicated by the eBay
    itemId.

    max_pages acts as a safety cap so one
    product cannot unexpectedly consume an
    unlimited number of API requests.
    """
    if (
        count_per_page < 1
        or count_per_page > 200
    ):
        raise ValueError(
            "count_per_page must be "
            "between 1 and 200."
        )

    if max_pages < 1:
        raise ValueError(
            "max_pages must be at least 1."
        )

    combined_items: list[
        dict[str, Any]
    ] = []

    seen_item_ids: set[str] = set()

    pages_fetched = 0

    total_results: Any = None

    for page in range(
        1,
        max_pages + 1,
    ):
        print(
            f"  SoldComps page "
            f"{page}/{max_pages}..."
        )

        payload = (
            search_sold_listings(
                keyword=keyword,
                ebay_site=ebay_site,
                count=count_per_page,
                page=page,
                sold_after=sold_after,
            )
        )

        pages_fetched += 1

        if total_results is None:
            total_results = (
                payload.get(
                    "totalResults"
                )
            )

        items = (
            payload.get("items")
            or []
        )

        for item in items:
            item_id = item.get(
                "itemId"
            )

            if item_id is not None:
                item_id = str(
                    item_id
                )

                if (
                    item_id
                    in seen_item_ids
                ):
                    continue

                seen_item_ids.add(
                    item_id
                )

            combined_items.append(
                item
            )

        print(
            f"    Raw items: "
            f"{len(items)}"
        )

        print(
            f"    Unique accumulated: "
            f"{len(combined_items)}"
        )

        has_next_page = bool(
            payload.get(
                "hasNextPage"
            )
        )

        if not has_next_page:
            break

    return {
        "keyword": keyword,
        "items": combined_items,
        "totalItems": len(
            combined_items
        ),
        "totalResults": (
            total_results
        ),
        "pagesFetched": (
            pages_fetched
        ),
    }