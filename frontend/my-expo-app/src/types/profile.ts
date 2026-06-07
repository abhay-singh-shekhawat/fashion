export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type SkinTone = 'warm' | 'cool' | 'neutral' | 'olive' | 'unknown';

export interface Profile {
  _id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  skinTone: SkinTone;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: Gender;
  skinTone: SkinTone;
}
