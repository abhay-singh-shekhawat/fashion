import { apiClient } from './apiClient';

export interface UserProfile {
  _id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  skinTone: 'warm' | 'cool' | 'neutral' | 'olive' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: string;
  skinTone: string;
}

export interface UserProgress {
  userId: string;
  points: number;
  level: number;
  totalScans: number;
  totalOutfitsRated: number;
  achievements: string[];
  currentStreak: number;
  joinedDate: string;
}

export interface Achievement {
  _id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
  unlockedAt: string;
}

class ProfileAPI {
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get<UserProfile>(
        '/profile/get/profile'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to fetch profile';
      throw new Error(message);
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const response = await apiClient.post<{ profile: UserProfile }>(
        '/profile/upload/profile',
        data
      );
      return response.data.profile;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to update profile';
      throw new Error(message);
    }
  }

  async getUserProgress(): Promise<UserProgress> {
    try {
      const response = await apiClient.get<UserProgress>(
        '/user/progress'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to fetch progress';
      throw new Error(message);
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiClient.get<{ achievements: Achievement[] }>(
        '/user/achievements'
      );
      return response.data.achievements || [];
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to fetch achievements';
      throw new Error(message);
    }
  }
}

export const profileAPI = new ProfileAPI();