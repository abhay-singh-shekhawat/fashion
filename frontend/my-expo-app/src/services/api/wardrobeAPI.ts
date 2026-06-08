import { apiClient } from './apiClient';

export interface ClothingItem {
  _id: string;
  userId: string;
  name: string;
  category: 'top' | 'bottom' | 'outerwear' | 'footwear' | 'accessory' | 'other';
  color: string;
  formality: 'casual' | 'smart_casual' | 'formal' | 'business' | 'party' | 'sporty' | 'traditional' | 'unknown';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddItemRequest {
  name: string;
  category: string;
  color?: string;
  formality?: string;
  imageUrl?: string;
}

export interface Outfit {
  top?: ClothingItem;
  bottom?: ClothingItem;
  outerwear?: ClothingItem;
  footwear?: ClothingItem;
  accessories?: ClothingItem[];
}

export interface OutfitSuggestion {
  outfit: Outfit;
  suggestion: {
    outfit: string;
    weatherFit: string;
    occasion?: string;
    note: string;
  };
}

class WardrobeAPI {
  async addItem(data: AddItemRequest): Promise<ClothingItem> {
    try {
      const response = await apiClient.post<{ item: ClothingItem }>(
        '/wardrobe/add/item',
        data
      );
      return response.data.item;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to add item';
      throw new Error(message);
    }
  }

  async getWardrobe(): Promise<ClothingItem[]> {
    try {
      const response = await apiClient.get<{ items: ClothingItem[] }>(
        '/wardrobe/get/wardrobe'
      );
      return response.data.items || [];
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to fetch wardrobe';
      throw new Error(message);
    }
  }

  async getWardrobeSuggestions(): Promise<OutfitSuggestion> {
    try {
      const response = await apiClient.get<OutfitSuggestion>(
        '/wardrobe/get/suggestions'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get suggestions';
      throw new Error(message);
    }
  }

  async getOccasionSuggestion(
    occasion: string = 'casual'
  ): Promise<OutfitSuggestion> {
    try {
      const response = await apiClient.get<OutfitSuggestion>(
        '/wardrobe/api/suggestions/occasion',
        {
          params: { occasion },
        }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to get occasion suggestion';
      throw new Error(message);
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/wardrobe/delete/item/${itemId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to delete item';
      throw new Error(message);
    }
  }
}

export const wardrobeAPI = new WardrobeAPI();