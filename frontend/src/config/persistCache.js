const STORAGE_KEY = 'stylesense:queryCache';

/* Only cold-start queries worth painting instantly are persisted. Shopping
   ideas ride along so a reload shows the last ones without spending SerpAPI
   searches on the same tap. */
const PERSISTED_ROOTS = new Set([
  'profile',
  'progress',
  'wardrobe',
  'dailyOutfit',
  'skinTone',
  'ratingHistory',
  'shoppingSuggestions',
]);

/**
 * Hydrates the query cache from localStorage so a reload paints real data
 * immediately instead of an empty shell. Everything restored is marked stale,
 * so it revalidates in the background rather than being trusted blindly.
 */
export function restoreQueryCache(queryClient) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return;

    for (const [key, data] of entries) {
      queryClient.setQueryData(JSON.parse(key), data);
    }
    queryClient.invalidateQueries();
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** Persists successful queries (debounced) on every cache change. */
export function persistQueryCache(queryClient) {
  let timer = null;

  const flush = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const entries = queryClient
          .getQueryCache()
          .getAll()
          .filter(
            (query) =>
              query.state.status === 'success' && PERSISTED_ROOTS.has(query.queryKey[0]),
          )
          .map((query) => [JSON.stringify(query.queryKey), query.state.data]);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {
        /* Quota or serialisation failures are non-fatal. */
      }
    }, 300);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(flush);
  return () => {
    unsubscribe();
    clearTimeout(timer);
  };
}

export function clearPersistedQueryCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
