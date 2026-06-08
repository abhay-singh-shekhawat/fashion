import { apiClient } from './apiClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  userId: string;
  reply: {
    message: string;
  };
  success: boolean;
}

export interface ChatRequest {
  userId: string;
  message: string;
  image?: any;
}

class ChatAPI {
  async sendMessage(userId: string, message: string, image?: any): Promise<ChatResponse> {
    try {
      const data: any = {
        userId,
        message,
      };

      if (image) {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('message', message);
        formData.append('image', image);

        const response = await apiClient.post<ChatResponse>(
          '/agent/chat',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        return response.data;
      }

      const response = await apiClient.post<ChatResponse>(
        '/agent/chat',
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to send message';
      throw new Error(message);
    }
  }
}

export const chatAPI = new ChatAPI();