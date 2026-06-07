import { useEffect, useCallback } from 'react';
import { socketService } from '../services/socket/socketClient';
import { socketListeners } from '../services/socket/socketListeners';

export const useSocket = () => {
  useEffect(() => {
    const initSocket = async () => {
      await socketService.connect();
    };

    initSocket();

    return () => {
      socketListeners.removeAllListeners();
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    socketService.off(event, callback);
  }, []);

  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  return {
    emit,
    on,
    off,
    isConnected,
  };
};
