import { apiClient } from './apiClient';
import { asyncStorageService } from '../storage/asyncStorage';

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
}

export interface RegisterResponse extends LoginResponse {}

class AuthAPI {
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(
        '/user/register',
        {
          name,
          email,
          password,
        }
      );

      // Save token immediately after registration
      if (response.data.accessToken) {
        await asyncStorageService.saveToken(response.data.accessToken);
        await asyncStorageService.saveUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Registration failed';
      throw new Error(message);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/user/login', {
        email,
        password,
      });

      // Save token after login
      if (response.data.accessToken) {
        await asyncStorageService.saveToken(response.data.accessToken);
        await asyncStorageService.saveUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Invalid email or password';
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear token from storage
      await asyncStorageService.clearAll();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      // Try to verify token by getting profile
      const response = await apiClient.get('/profile/get/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return !!response.data;
    } catch (error) {
      return false;
    }
  }
}

export const authAPI = new AuthAPI();