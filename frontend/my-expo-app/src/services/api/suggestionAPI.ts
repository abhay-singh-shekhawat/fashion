import { apiClient } from './apiClient';

export interface DailyRecommendation {
  responseData: {
    userId: string;
    date: string;
    temperature: number;
    weatherFeel: string;
    recommendation: {
      outfit: string;
      source: string;
      message: string;
      weatherSource: string;
    };
  };
  note: string;
}

export interface OccasionSuggestion {
  responseData: {
    userId: string;
    temperature: number;
    weatherNote: string;
    occasion: string;
    suggestions: string[];
    basedOn: string;
  };
  note: string;
}

export interface ShoppingAdvice {
  userId: string;
  wardrobeSize: number;
  gaps: string[];
  recommendations: string[];
}

class SuggestionAPI {
  async getDailyRecommendations(): Promise<DailyRecommendation> {
    try {
      const response = await apiClient.get<DailyRecommendation>(
        '/suggestion/get/daily/recommendations'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get daily recommendations';
      throw new Error(message);
    }
  }

  async getOccasionSuggestions(
    occasion: string
  ): Promise<OccasionSuggestion> {
    try {
      const response = await apiClient.post<OccasionSuggestion>(
        '/suggestion/get/occasion/suggestions',
        { occasion }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get occasion suggestions';
      throw new Error(message);
    }
  }

  async getShoppingSuggestions(): Promise<ShoppingAdvice> {
    try {
      const response = await apiClient.get<ShoppingAdvice>(
        '/suggestion/get/shopping'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get shopping suggestions';
      throw new Error(message);
    }
  }
}

export const suggestionAPI = new SuggestionAPI();