import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://fashion.sytes.net/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  /* Auth is the `Authorization: Bearer` header, not cookies — the httpOnly
     refreshToken cookie the server sets is never read back (there is no
     /refresh route). The backend's CORS replies with `Access-Control-Allow-Origin: *`,
     and browsers reject a wildcard origin when credentials mode is `include`,
     so enabling withCredentials here would make every response fail CORS. */
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* There is no /refresh endpoint on the backend — a 401 means re-login. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

/** Normalises the backend's `{ error, details }` shape into a display string. */
export function apiError(error, fallback = 'Something went wrong') {
  if (error?.response) {
    const data = error.response.data;
    if (data?.details?.length) return data.details[0]?.message ?? data.error ?? fallback;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.error) return data.error;
    return fallback;
  }

  /* No response at all means the request never reached the server — almost
     always because the Express backend isn't running on the expected port. */
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `Can't reach the server at ${API_URL}. Is the backend running?`;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Try again.';
  }
  return error?.message ?? fallback;
}

export const ENDPOINTS = {
  register: '/user/register',
  login: '/user/login',
  me: '/user/me',
  forgotPassword: '/user/forgot-password',
  resetPassword: '/user/reset-password',
  profileCreate: '/profile/upload/profile',
  profileUpdate: '/profile/update/profile',
  profileGet: '/profile/get/profile',
  wardrobe: '/wardrobe/get/wardrobe',
  wardrobeAdd: '/wardrobe/add/item',
  dailyOutfit: '/wardrobe/get/suggestions',
  occasionOutfit: '/wardrobe/api/suggestions/occasion',
  scanOutfit: '/scan/outfit',
  chat: '/agent/chat',
  progress: '/progress/get/progress',
  ratePhoto: '/outfit/rate',
  rateSaved: '/outfit/rate-saved',
  ratingHistory: '/outfit/history',
  ratingItem: (id) => `/outfit/history/${id}`,
  ratingFavourite: (id) => `/outfit/history/${id}/favourite`,
  skinToneScan: '/skin-tone/scan',
  skinToneGet: '/skin-tone/',
  shoppingSuggestions: '/suggestion/get/shopping',
  activityLog: '/activity/log',
};
