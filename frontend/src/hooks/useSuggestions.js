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

export function useOccasionOutfit(occasion) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['occasionOutfit', occasion],
    queryFn: async () =>
      (await api.get(ENDPOINTS.occasionOutfit, { params: { occasion } })).data,
    enabled: Boolean(token) && Boolean(occasion),
  });
}
