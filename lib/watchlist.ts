export const WATCHLIST_STORAGE_KEY = "tcgmvp-watchlist-v1";
export const WATCHLIST_CHANGED_EVENT = "tcgmvp:watchlist-changed";

function normalizeWatchlist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0
      )
    )
  );
}

export function getWatchlist(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(
      WATCHLIST_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    return normalizeWatchlist(JSON.parse(storedValue));
  } catch {
    return [];
  }
}

function saveWatchlist(slugs: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeWatchlist(slugs);

  window.localStorage.setItem(
    WATCHLIST_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  window.dispatchEvent(
    new CustomEvent(WATCHLIST_CHANGED_EVENT)
  );
}

export function isProductWatchlisted(slug: string): boolean {
  return getWatchlist().includes(slug);
}

export function addToWatchlist(slug: string) {
  const current = getWatchlist();

  if (current.includes(slug)) {
    return;
  }

  saveWatchlist([...current, slug]);
}

export function removeFromWatchlist(slug: string) {
  const current = getWatchlist();

  saveWatchlist(
    current.filter((savedSlug) => savedSlug !== slug)
  );
}

export function toggleWatchlist(slug: string): boolean {
  const currentlySaved = isProductWatchlisted(slug);

  if (currentlySaved) {
    removeFromWatchlist(slug);
    return false;
  }

  addToWatchlist(slug);
  return true;
}