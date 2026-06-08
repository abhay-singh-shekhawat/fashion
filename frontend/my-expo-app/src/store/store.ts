import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import appReducer from './slices/appSlice';
import wardrobeReducer from './slices/wardrobeSlice';
import scanReducer from './slices/scanSlice';
import chatReducer from './slices/chatSlice';
import suggestionReducer from './slices/suggestionSlice';
import progressReducer from './slices/progressSlice';
import notificationReducer from './slices/notificationSlice';

// Persist config for auth
const persistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    app: appReducer,
    wardrobe: wardrobeReducer,
    scan: scanReducer,
    chat: chatReducer,
    suggestion: suggestionReducer,
    progress: progressReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;