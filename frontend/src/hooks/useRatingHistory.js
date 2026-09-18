import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ratingHistoryKey = ['ratingHistory'];

/* The list and a single item share one root key, so an optimistic write keeps
   the history screen and an open detail screen in step. */
const patchEntry = (current, id, patch) => {
  if (Array.isArray(current)) {
    return current.map((entry) => (entry._id === id ? { ...entry, ...patch } : entry));
  }
  if (current?._id === id) return { ...current, ...patch };
  return current;
};

export function useRatingHistory() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ratingHistoryKey,
    queryFn: async () => (await api.get(ENDPOINTS.ratingHistory)).data.items ?? [],
    enabled: Boolean(token),
  });
}

/* Only fetched when the wanted rating isn't in the list cache — i.e. when a
   detail screen is opened directly rather than from the history list. */
export function useRating(id, { enabled = true } = {}) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...ratingHistoryKey, 'item', id],
    queryFn: async () => (await api.get(ENDPOINTS.ratingItem(id))).data.item,
    enabled: Boolean(token) && Boolean(id) && enabled,
  });
}

/* The star flips immediately and rolls back on failure: waiting on a round trip
   makes a two-state toggle feel broken. */
export function useFavouriteRating() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: async ({ id, isFavourite }) =>
      (await api.patch(ENDPOINTS.ratingFavourite(id), { isFavourite })).data.item,
    onMutate: async ({ id, isFavourite }) => {
      await queryClient.cancelQueries({ queryKey: ratingHistoryKey });
      const previous = queryClient.getQueriesData({ queryKey: ratingHistoryKey });
      queryClient.setQueriesData({ queryKey: ratingHistoryKey }, (current) =>
        patchEntry(current, id, { isFavourite }),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      push(apiError(error, 'Could not update that favourite'), 'error');
    },
    onSuccess: (item) => push(item?.isFavourite ? 'Kept forever ⭐' : 'Star removed', 'success'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ratingHistoryKey }),
  });
}

export function useDeleteRating() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: async (id) => (await api.delete(ENDPOINTS.ratingItem(id))).data,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ratingHistoryKey });
      const previous = queryClient.getQueriesData({ queryKey: ratingHistoryKey });
      queryClient.setQueryData(ratingHistoryKey, (current = []) =>
        current.filter((entry) => entry._id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      push(apiError(error, 'Could not delete that rating'), 'error');
    },
    /* A deleted fit must not survive in the detail cache, or reopening its link
       would repaint a rating the server no longer has. */
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: [...ratingHistoryKey, 'item', id] });
      push('Rating deleted', 'success');
    },
  });
}
