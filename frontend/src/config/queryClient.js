import { QueryClient } from '@tanstack/react-query';
import { restoreQueryCache } from './persistCache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      /* The backend rate-limits to 100 req / 15 min per IP, so back off hard. */
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      gcTime: 24 * 60 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

/* Hydrate from the previous session before React renders anything. */
restoreQueryCache(queryClient);

