import { useQuery } from '@tanstack/react-query';
import { api, ENDPOINTS } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const activityLogKey = ['activityLog'];

/** Everything the app has done for this user: suggested fits, rated fits and
 *  closet additions, newest first. */
export function useActivityLog(limit = 12) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...activityLogKey, limit],
    queryFn: async () =>
      (await api.get(ENDPOINTS.activityLog, { params: { limit } })).data.items ?? [],
    enabled: Boolean(token),
  });
}
