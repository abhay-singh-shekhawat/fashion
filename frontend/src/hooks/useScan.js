import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';

/** Uploads an outfit photo; results stream back over `scan:*` socket events. */
export function useScanOutfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('image', file);
      return (await api.post(ENDPOINTS.scanOutfit, form)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
