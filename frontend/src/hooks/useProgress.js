import { useQuery } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const progressKey = ['progress'];

export function useProgress() {
  const { token } = useAuth();
  return useQuery({
    queryKey: progressKey,
    queryFn: async () => (await api.get(ENDPOINTS.progress)).data,
    enabled: Boolean(token),
  });
}
