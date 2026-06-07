import { socketService } from './socketClient';

export const socketListeners = {
  // Scan events
  onScanProgress(callback: (progress: number) => void): void {
    socketService.on('scan:progress', callback);
  },

  onScanItemsDetected(callback: (items: any[]) => void): void {
    socketService.on('scan:items:detected', callback);
  },

  onScanComplete(callback: (data: any) => void): void {
    socketService.on('scan:complete', callback);
  },

  onScanError(callback: (error: string) => void): void {
    socketService.on('scan:error', callback);
  },

  // Chat events
  onChatStart(callback: () => void): void {
    socketService.on('chat:start', callback);
  },

  onChatTyping(callback: () => void): void {
    socketService.on('chat:typing', callback);
  },

  onChatResponseChunk(callback: (chunk: string) => void): void {
    socketService.on('chat:response:chunk', callback);
  },

  onChatResponseComplete(callback: (data: any) => void): void {
    socketService.on('chat:response:complete', callback);
  },

  onChatError(callback: (error: string) => void): void {
    socketService.on('chat:error', callback);
  },

  // Rating events
  onRatingWeatherDone(callback: (data: any) => void): void {
    socketService.on('rating:weather:done', callback);
  },

  onRatingSkintoneDone(callback: (data: any) => void): void {
    socketService.on('rating:skintone:done', callback);
  },

  onRatingComplete(callback: (data: any) => void): void {
    socketService.on('rating:complete', callback);
  },

  // Notification events
  onNotification(callback: (notification: any) => void): void {
    socketService.on('notification', callback);
  },

  // Cleanup
  removeAllListeners(): void {
    socketService.off('scan:progress');
    socketService.off('scan:items:detected');
    socketService.off('scan:complete');
    socketService.off('scan:error');
    socketService.off('chat:start');
    socketService.off('chat:typing');
    socketService.off('chat:response:chunk');
    socketService.off('chat:response:complete');
    socketService.off('chat:error');
    socketService.off('rating:weather:done');
    socketService.off('rating:skintone:done');
    socketService.off('rating:complete');
    socketService.off('notification');
  },
};
