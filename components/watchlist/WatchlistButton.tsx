"use client";

import { useEffect, useState } from "react";

import {
  WATCHLIST_CHANGED_EVENT,
  WATCHLIST_STORAGE_KEY,
  isProductWatchlisted,
  toggleWatchlist,
} from "@/lib/watchlist";

type WatchlistButtonProps = {
  slug: string;
  productName: string;
  compact?: boolean;
};

export default function WatchlistButton({
  slug,
  productName,
  compact = false,
}: WatchlistButtonProps) {
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function syncWatchlist() {
      setSaved(isProductWatchlisted(slug));
    }

    syncWatchlist();
    setHydrated(true);

    function handleStorage(event: StorageEvent) {
      if (
        event.key === null ||
        event.key === WATCHLIST_STORAGE_KEY
      ) {
        syncWatchlist();
      }
    }

    window.addEventListener(
      WATCHLIST_CHANGED_EVENT,
      syncWatchlist
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        WATCHLIST_CHANGED_EVENT,
        syncWatchlist
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [slug]);

  function handleToggle() {
    const nextSavedState = toggleWatchlist(slug);
    setSaved(nextSavedState);
  }

  if (compact) {
    return (
      <button
        type="button"
        className={`watchlist-button-compact ${
          saved ? "is-saved" : ""
        }`}
        aria-label={
          saved
            ? `Remove ${productName} from watchlist`
            : `Add ${productName} to watchlist`
        }
        aria-pressed={saved}
        onClick={handleToggle}
      >
        <span aria-hidden="true">
          {hydrated && saved ? "★" : "☆"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`watchlist-button ${
        saved ? "is-saved" : ""
      }`}
      aria-pressed={saved}
      onClick={handleToggle}
    >
      <span
        className="watchlist-button-icon"
        aria-hidden="true"
      >
        {hydrated && saved ? "★" : "☆"}
      </span>

      <span>
        {hydrated && saved
          ? "In Watchlist"
          : "Add to Watchlist"}
      </span>
    </button>
  );
}