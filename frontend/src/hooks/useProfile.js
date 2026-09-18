import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const profileKey = ['profile'];

export function useProfile() {
  const { token } = useAuth();
  return useQuery({
    queryKey: profileKey,
    queryFn: async () => (await api.get(ENDPOINTS.profileGet)).data,
    enabled: Boolean(token),
    /* A 404 here means "no profile yet" and gates onboarding — never retry it. */
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post(ENDPOINTS.profileCreate, payload)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKey, data.profile);
      queryClient.invalidateQueries({ queryKey: profileKey });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.put(ENDPOINTS.profileUpdate, payload)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKey, data.profile);
      queryClient.invalidateQueries({ queryKey: ['dailyOutfit'] });
      queryClient.invalidateQueries({ queryKey: ['occasionOutfit'] });
    },
  });
}
