import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

export function useRemoveItem() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: async (id) => (await api.delete(ENDPOINTS.wardrobeRemove(id))).data,
    /* The tile goes away under the finger instead of after a round trip, and is
       put back untouched if the server refuses the delete. */
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: wardrobeKey });
      const previous = queryClient.getQueryData(wardrobeKey);
      queryClient.setQueryData(wardrobeKey, (current = []) =>
        current.filter((item) => item._id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(wardrobeKey, context.previous);
      push(apiError(error, 'Could not remove that item'), 'error');
    },
    onSuccess: () => push('Item removed from your closet', 'success'),
    onSettled: () => {
      /* Suggestions and progress are derived from the wardrobe, and the backend
         has already busted its own 300s cache for us. */
      queryClient.invalidateQueries({ queryKey: wardrobeKey });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['dailyOutfit'] });
      queryClient.invalidateQueries({ queryKey: ['occasionOutfit'] });
    },
  });
}
