export type Category = 'top' | 'bottom' | 'outerwear' | 'footwear' | 'accessory' | 'other';
export type Formality = 'casual' | 'smart_casual' | 'formal' | 'business' | 'party' | 'sporty' | 'traditional' | 'unknown';

export interface ClothingItem {
  _id: string;
  userId: string;
  name: string;
  category: Category;
  color: string;
  formality: Formality;
  image?: string;
  createdAt: string;
}

export interface AddItemRequest {
  name: string;
  category: Category;
  color?: string;
  formality?: Formality;
  image?: string;
}

export interface Outfit {
  top: ClothingItem;
  bottom: ClothingItem;
}

export interface OutfitSuggestion {
  outfit: string;
  weatherFit: string;
  note: string;
  suggestion?: Outfit;
}
