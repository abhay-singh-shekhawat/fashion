import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { asyncStorageService } from '../storage/asyncStorage';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request Interceptor - Add token to every request
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await asyncStorageService.getToken();
      if (token) {
        if (!config.headers) config.headers = {} as any;
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor - Handle 401 and retry
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Only retry once (originalRequest._retry prevents infinite loop)
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue failed requests while refreshing
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Try to refresh token
          const response = await axios.post<{ accessToken: string }>(
            `${API_BASE}/user/refresh`,
            {},
            { withCredentials: true }
          );

          const newToken = response.data.accessToken;
          if (newToken) await asyncStorageService.saveToken(newToken);

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (err) {
          processQueue(err, null);
          // Clear token on refresh failure
          await asyncStorageService.clearAll();
          // Could navigate to login here if desired
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = createApiClient();