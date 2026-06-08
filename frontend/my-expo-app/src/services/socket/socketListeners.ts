import { socketService } from './socketClient';

class SocketListeners {
  private listeners: Map<string, Function[]> = new Map();

  // Scan Events
  onScanProgress(callback: (data: any) => void): void {
    socketService.on('scan:progress', callback);
    this.addListener('scan:progress', callback);
  }

  onScanItemsDetected(callback: (data: any) => void): void {
    socketService.on('scan:items:detected', callback);
    this.addListener('scan:items:detected', callback);
  }

  onScanComplete(callback: (data: any) => void): void {
    socketService.on('scan:complete', callback);
    this.addListener('scan:complete', callback);
  }

  onScanError(callback: (data: any) => void): void {
    socketService.on('scan:error', callback);
    this.addListener('scan:error', callback);
  }

  // Chat Events
  onChatStart(callback: (data: any) => void): void {
    socketService.on('chat:start', callback);
    this.addListener('chat:start', callback);
  }

  onChatTyping(callback: (data: any) => void): void {
    socketService.on('chat:typing', callback);
    this.addListener('chat:typing', callback);
  }

  onChatResponseChunk(callback: (data: any) => void): void {
    socketService.on('chat:response:chunk', callback);
    this.addListener('chat:response:chunk', callback);
  }

  onChatResponseComplete(callback: (data: any) => void): void {
    socketService.on('chat:response:complete', callback);
    this.addListener('chat:response:complete', callback);
  }

  onChatError(callback: (data: any) => void): void {
    socketService.on('chat:error', callback);
    this.addListener('chat:error', callback);
  }

  // Rating Events
  onRatingWeatherDone(callback: (data: any) => void): void {
    socketService.on('rating:weather:done', callback);
    this.addListener('rating:weather:done', callback);
  }

  onRatingSkintoneDone(callback: (data: any) => void): void {
    socketService.on('rating:skintone:done', callback);
    this.addListener('rating:skintone:done', callback);
  }

  onRatingScoreDone(callback: (data: any) => void): void {
    socketService.on('rating:score:done', callback);
    this.addListener('rating:score:done', callback);
  }

  onRatingTipsChunk(callback: (data: any) => void): void {
    socketService.on('rating:tips:chunk', callback);
    this.addListener('rating:tips:chunk', callback);
  }

  onRatingComplete(callback: (data: any) => void): void {
    socketService.on('rating:complete', callback);
    this.addListener('rating:complete', callback);
  }

  // Notification Events
  onNotificationAchievement(callback: (data: any) => void): void {
    socketService.on('notification:achievement', callback);
    this.addListener('notification:achievement', callback);
  }

  onNotificationSuggestion(callback: (data: any) => void): void {
    socketService.on('notification:suggestion', callback);
    this.addListener('notification:suggestion', callback);
  }

  // Helper methods
  private addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeAllListeners(): void {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        socketService.off(event, callback as any);
      });
    });
    this.listeners.clear();
  }

  removeListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        socketService.off(event, callback as any);
      }
    }
  }
}

export const socketListeners = new SocketListeners();