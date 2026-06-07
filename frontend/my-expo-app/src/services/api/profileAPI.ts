import { apiClient } from './apiClient';
import { Profile, UpdateProfileRequest } from '../../types/profile';

export const profileAPI = {
  async getProfile(): Promise<Profile> {
    try {
      const response = await apiClient.get<Profile>('/profile/get/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(data: UpdateProfileRequest): Promise<Profile> {
    try {
      const response = await apiClient.post<{ profile: Profile }>('/profile/upload/profile', data);
      return response.data.profile;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};
