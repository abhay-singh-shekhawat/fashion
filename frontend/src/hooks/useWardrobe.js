import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const wardrobeKey = ['wardrobe'];

export function useWardrobe() {
  const { token } = useAuth();
  return useQuery({
    queryKey: wardrobeKey,
    queryFn: async () => (await api.get(ENDPOINTS.wardrobe)).data.items ?? [],
    enabled: Boolean(token),
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => (await api.post(ENDPOINTS.wardrobeAdd, payload)).data,
    onSuccess: ({ item }) => {
      /* GET /wardrobe is Redis-cached for 300s and addClothingItem never
         invalidates it, so we splice the item into the cache ourselves —
         otherwise the new item disappears on the next refetch. */
      queryClient.setQueryData(wardrobeKey, (current = []) => [
        item,
        ...current.filter((existing) => existing._id !== item._id),
      ]);
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['dailyOutfit'] });
      queryClient.invalidateQueries({ queryKey: ['occasionOutfit'] });
    },
  });
}
