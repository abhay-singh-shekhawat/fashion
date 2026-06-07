import { apiClient } from './apiClient';
import { ClothingItem, AddItemRequest, OutfitSuggestion } from '../../types/wardrobe';

export const wardrobeAPI = {
  async addItem(data: AddItemRequest): Promise<ClothingItem> {
    try {
      const response = await apiClient.post<{ item: ClothingItem }>('/wardrobe/add/item', data);
      return response.data.item;
    } catch (error) {
      console.error('Add item error:', error);
      throw error;
    }
  },

  async getWardrobe(): Promise<ClothingItem[]> {
    try {
      const response = await apiClient.get<{ items: ClothingItem[] }>('/wardrobe/get/wardrobe');
      return response.data.items;
    } catch (error) {
      console.error('Get wardrobe error:', error);
      throw error;
    }
  },

  async getSuggestions(): Promise<OutfitSuggestion> {
    try {
      const response = await apiClient.get<OutfitSuggestion>('/wardrobe/get/suggestions');
      return response.data;
    } catch (error) {
      console.error('Get suggestions error:', error);
      throw error;
    }
  },

  async getOccasionSuggestion(occasion: string = 'casual'): Promise<OutfitSuggestion> {
    try {
      const response = await apiClient.get<{ suggestion: OutfitSuggestion }>('/wardrobe/api/suggestions/occasion', {
        params: { occasion },
      });
      return response.data.suggestion;
    } catch (error) {
      console.error('Get occasion suggestion error:', error);
      throw error;
    }
  },
};
