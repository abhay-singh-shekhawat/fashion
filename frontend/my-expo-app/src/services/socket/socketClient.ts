import { io, Socket } from 'socket.io-client';
import { asyncStorageService } from '../storage/asyncStorage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const socketService = {
  async connect(): Promise<Socket | null> {
    try {
      if (socket?.connected) {
        return socket;
      }

      const token = await asyncStorageService.getToken();

      if (!token) {
        console.warn('No token available for socket connection');
        return null;
      }

      socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      return socket;
    } catch (error) {
      console.error('Socket connection error:', error);
      return null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  on(event: string, callback: (...args: any[]) => void): void {
    if (socket) {
      socket.on(event, callback);
    }
  },

  off(event: string, callback?: (...args: any[]) => void): void {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },

  emit(event: string, data?: any): void {
    if (socket) {
      socket.emit(event, data);
    }
  },

  isConnected(): boolean {
    return socket?.connected || false;
  },
};
