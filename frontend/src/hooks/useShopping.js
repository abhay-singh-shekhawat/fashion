import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const shoppingSuggestionsKey = ['shoppingSuggestions'];

/**
 * Each uncached answer costs real SerpAPI searches, so the query stays idle
 * until the panel asks for it — `enabled: false` means mounting the home
 * screen never spends quota on its own.
 *
 * `fetchIdeas({ fresh: true })` sends `refresh=1`, which makes the backend
 * regenerate instead of answering from its 24h cache. The flag lives in a ref
 * because the queryFn reads it: state set just before refetch() would still be
 * the old value inside the closure.
 */
export function useShoppingSuggestions() {
  const { token } = useAuth();
  const freshRef = useRef(false);

  const query = useQuery({
    queryKey: shoppingSuggestionsKey,
    queryFn: async () =>
      (await api.get(ENDPOINTS.shoppingSuggestions, {
        params: freshRef.current ? { refresh: 1 } : undefined,
      })).data,
    enabled: false,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const fetchIdeas = ({ fresh = false } = {}) => {
    freshRef.current = fresh;
    return query.refetch();
  };

  return { ...query, fetchIdeas };
}
