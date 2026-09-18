import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from './useSocketEvent';
import { useToast } from '../context/ToastContext';

/**
 * Global realtime notifications. Mounted once inside the authenticated shell.
 * Every emitter is a no-op when the user is offline, so nothing here is
 * required for the app to function.
 */
export function useNotifications() {
  const { push } = useToast();
  const queryClient = useQueryClient();

  useSocketEvent('notification:achievement', ({ achievement, points } = {}) => {
    push(points ? `${achievement} unlocked · +${points} pts` : `${achievement} unlocked`, 'success');
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  });

  useSocketEvent('notification:new', ({ message, type } = {}) => {
    push(message ?? 'New notification', type === 'error' ? 'error' : 'info');
  });

  useSocketEvent('notification:suggestion', () => {
    queryClient.invalidateQueries({ queryKey: ['dailyOutfit'] });
  });
}
