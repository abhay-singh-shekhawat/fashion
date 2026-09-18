import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const skinToneKey = ['skinTone'];

export function useSkinTone() {
  const { token } = useAuth();
  return useQuery({
    queryKey: skinToneKey,
    queryFn: async () => (await api.get(ENDPOINTS.skinToneGet)).data,
    enabled: Boolean(token),
    retry: false,
  });
}

export function useScanSkinTone() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('image', file);
      return (await api.post(ENDPOINTS.skinToneScan, form)).data;
    },
    onSuccess: () => {
      /* Result arrives over the `skintone:complete` socket event. */
    },
  });
}
