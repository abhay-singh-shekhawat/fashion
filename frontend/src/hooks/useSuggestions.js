import { useQuery } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const dailyOutfitKey = ['dailyOutfit'];

/**
 * Returns either a real suggestion or one of the backend's null-suggestion
 * fallbacks (`{ message, suggestion: null }`) when the profile or wardrobe
 * is empty — callers must distinguish those cases.
 */
export function useDailyOutfit() {
  const { token } = useAuth();
  return useQuery({
    queryKey: dailyOutfitKey,
    queryFn: async () => (await api.get(ENDPOINTS.dailyOutfit)).data,
    enabled: Boolean(token),
    retry: false,
  });
}

/**
 * Occasion ideas that are deliberately not built from the closet: the backend
 * writes them from the body profile, the occasion and today's weather. The
 * nonce gives each "another one" its own request.
 */
export function useOccasionIdeas(occasion, { nonce = 0 } = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['occasionIdeas', occasion, nonce],
    queryFn: async () =>
      (await api.get(ENDPOINTS.occasionIdeas, { params: { occasion, refresh: 1 } })).data,
    enabled: Boolean(token) && Boolean(occasion),
  });
}

/**
 * One occasion, styled from the closet.
 *
 * `refresh` asks the backend for a combination it has not just handed back
 * (it bypasses the 5-minute cache and skips the previous pick), and `nonce`
 * makes each of those re-rolls a distinct query rather than a cache hit.
 */
export function useOccasionOutfit(occasion, { refresh = false, nonce = 0 } = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['occasionOutfit', occasion, refresh ? 'refresh' : 'closet', nonce],
    queryFn: async () =>
      (await api.get(ENDPOINTS.occasionOutfit, {
        params: { occasion, ...(refresh ? { refresh: 1 } : {}) },
      })).data,
    enabled: Boolean(token) && Boolean(occasion),
  });
}
