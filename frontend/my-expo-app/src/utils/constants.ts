export const constants = {
  API_TIMEOUT: 10000,
  SOCKET_RECONNECT_DELAY: 1000,
  SOCKET_MAX_RECONNECT_ATTEMPTS: 5,
  TOAST_DURATION: 3000,
  AUTH_ERROR_TIMEOUT: 5000,

  // Gender options
  GENDER_OPTIONS: ['male', 'female', 'other', 'prefer_not_to_say'],

  // Skin tone options
  SKIN_TONE_OPTIONS: ['warm', 'cool', 'neutral', 'olive', 'unknown'],

  // Clothing categories
  CLOTHING_CATEGORIES: ['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'other'],

  // Formality levels
  FORMALITY_LEVELS: ['casual', 'smart_casual', 'formal', 'business', 'party', 'sporty', 'traditional', 'unknown'],

  // Storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@fashion_app:accessToken',
    REFRESH_TOKEN: '@fashion_app:refreshToken',
    USER: '@fashion_app:user',
    WARDROBE: '@fashion_app:wardrobe',
    PROFILE: '@fashion_app:profile',
  },
};
