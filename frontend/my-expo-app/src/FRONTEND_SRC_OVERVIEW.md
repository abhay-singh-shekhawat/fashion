# Frontend `src/` — Single-file Overview

This single document summarizes every file created under `src/` for Phase 1. For each file: path, purpose, main exports, key imports, parameters/signature, and external package dependencies needed. Use this as a quick reference to understand what exists, what each file does, and what is required to run or extend it.

---

## Top-level structure (summary)

src/
- components/
  - common/: Button.tsx, Input.tsx, Card.tsx, Modal.tsx, Loading.tsx, Toast.tsx
  - auth/: AuthHeader.tsx, LoginForm.tsx, RegisterForm.tsx
- screens/
  - auth/: LoginScreen.tsx, RegisterScreen.tsx, SplashScreen.tsx
  - main/: HomeScreen.tsx, ProfileSetupScreen.tsx, SettingsScreen.tsx
- navigation/: AuthStackNavigator.tsx, MainStackNavigator.tsx, BottomTabNavigator.tsx, RootNavigator.tsx
- store/: slices/ (authSlice.ts, userSlice.ts, appSlice.ts), store.ts
- services/
  - api/: apiClient.ts, authAPI.ts, profileAPI.ts, wardrobeAPI.ts
  - socket/: socketClient.ts, socketListeners.ts
  - storage/: asyncStorage.ts
  - index.ts
- hooks/: useAuth.ts, useApi.ts, useSocket.ts, index.ts
- types/: user.ts, profile.ts, wardrobe.ts, api.ts, index.ts
- utils/: constants.ts, validation.ts, formatting.ts, helpers.ts, index.ts

---

NOTE: The following per-file descriptions assume standard React Native + Expo environment and the dependencies listed at the end.

---

## components/common/Button.tsx
- Purpose: Reusable button component with variants (primary/secondary/danger), sizes and loading state.
- Exports: `Button: React.FC<ButtonProps>`
- Key imports: React, react-native primitives, ActivityIndicator, nativewind className usage
- Props/Parameters: { title: string, onPress: () => void, loading?: boolean, disabled?: boolean, variant?: 'primary'|'secondary'|'danger', size?: 'sm'|'md'|'lg', style?: ViewStyle }
- Notes: uses className for NativeWind styling; renders loading spinner when `loading` true.

## components/common/Input.tsx
- Purpose: Labeled text input with error display used across forms.
- Exports: `Input: React.FC<InputProps>`
- Key imports: React, TextInput, Text, View from react-native
- Props: extends TextInputProps plus { label?: string; error?: string }
- Notes: show error text when `error` provided; placeholderTextColor set.

## components/common/Card.tsx
- Purpose: Generic container with shadow and padding
- Exports: `Card: React.FC<CardProps>`
- Props: { children: ReactNode, style?: ViewStyle, className?: string }

## components/common/Modal.tsx
- Purpose: Confirmation modal used for destructive actions, with confirm/cancel callbacks
- Exports: `Dialog: React.FC<DialogProps>`
- Props: { visible: boolean, title: string, message: string, onConfirm: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, isDangerous?: boolean }

## components/common/Loading.tsx
- Purpose: Full-screen loading indicator component
- Exports: `Loading: React.FC<LoadingProps>`
- Props: { message?: string, size?: 'small'|'large' }

## components/common/Toast.tsx
- Purpose: Temporary notification with fade-out and type variants
- Exports: `Toast: React.FC<ToastProps>`
- Props: { message: string, type?: 'success'|'error'|'info'|'warning', duration?: number }

---

## components/auth/AuthHeader.tsx
- Purpose: Branding header for auth screens (title and tagline)
- Exports: `AuthHeader: React.FC` (no props)
- Key imports: React, Text, View

## components/auth/LoginForm.tsx
- Purpose: Form component for login used by LoginScreen
- Exports: `LoginForm: React.FC<LoginFormProps>`
- Key imports: react-hook-form, @hookform/resolvers/zod, zod, Input, Button
- Props expected: { onSubmit: (data: { email: string; password: string }) => void, loading?: boolean, error?: string|null, onRegisterPress: () => void }
- Validation: Zod schema: email (email), password (min length)

## components/auth/RegisterForm.tsx
- Purpose: Form component for registration used by RegisterScreen
- Exports: `RegisterForm: React.FC<RegisterFormProps>`
- Key imports: react-hook-form, zod, zodResolver, Input, Button
- Props: { onSubmit: (data: { name: string; email: string; password: string }) => void, loading?: boolean, error?: string|null, onLoginPress: () => void }
- Validation: name (min 2), email, password (min 8, uppercase, lowercase, number), confirmPassword matching

---

## screens/auth/LoginScreen.tsx
- Purpose: Page wrapper for login flow; mounts `LoginForm` and dispatches auth actions
- Exports: `LoginScreen: React.FC<NativeStackScreenProps>`
- Key imports: SafeAreaView, AuthHeader, LoginForm, useAuth hook, navigation types
- Behavior: passes `handleLogin` to `LoginForm` that dispatches login thunk via `useAuth`.

## screens/auth/RegisterScreen.tsx
- Purpose: Page wrapper for register flow; mounts `RegisterForm`
- Exports: `RegisterScreen`
- Key imports: AuthHeader, RegisterForm, useAuth

## screens/auth/SplashScreen.tsx
- Purpose: Initial loading screen; checks AsyncStorage token and verifies with backend
- Exports: `SplashScreen`
- Key imports: ActivityIndicator, useAuth, asyncStorageService
- Behavior: reads token from storage and triggers verify thunk

---

## screens/main/HomeScreen.tsx
- Purpose: Dashboard; shows daily recommendation card and quick stats
- Exports: `HomeScreen`
- Key imports: SafeAreaView, Card component, other presentational components
- Notes: Placeholder content; connects to `wardrobeAPI` and suggestion endpoints in Phase 3

## screens/main/ProfileSetupScreen.tsx
- Purpose: Profile completion form (height, weight, age, gender, skin tone)
- Exports: `ProfileSetupScreen`
- Key imports: Input, Button, useSelector for existing user profile, navigation
- Props: receives navigation; on submit will call profileAPI.updateProfile() in Phase 2

## screens/main/SettingsScreen.tsx
- Purpose: Placeholder settings page
- Exports: `SettingsScreen`

---

## navigation/AuthStackNavigator.tsx
- Purpose: Stack navigator for auth flow
- Exports: `AuthStackNavigator: React.FC`
- Key imports: @react-navigation/native-stack, LoginScreen, RegisterScreen
- Notes: headerShown false; used by RootNavigator

## navigation/MainStackNavigator.tsx
- Purpose: App main stack for deeper screens (Home, ProfileSetup, Settings)
- Exports: `MainStackNavigator`
- Key imports: createNativeStackNavigator, HomeScreen, ProfileSetupScreen, SettingsScreen

## navigation/BottomTabNavigator.tsx
- Purpose: Bottom tab navigation (Home, Settings)
- Exports: `BottomTabNavigator`
- Key imports: @react-navigation/bottom-tabs, HomeScreen, SettingsScreen
- Notes: tabBarActiveTintColor configured

## navigation/RootNavigator.tsx
- Purpose: App entry navigation; conditionally renders Auth or Main flow based on Redux auth state
- Exports: `RootNavigator`
- Key imports: NavigationContainer, useSelector, useDispatch, AuthStackNavigator, BottomTabNavigator, SplashScreen, socketService
- Behavior: checks `state.auth.isAuthenticated` and `state.app.appLoading`; triggers socket connect when authenticated

---

## store/slices/authSlice.ts
- Purpose: Manage authentication state and thunks for login/register/verify
- Exports: default reducer, actions { setUser, setToken, logout, setLoading, setError }, thunks { loginUser, registerUser, verifyToken }
- Key imports: @reduxjs/toolkit createSlice, createAsyncThunk; authAPI; asyncStorageService
- State shape: { user: User|null, accessToken: string|null, isAuthenticated: boolean, loading: boolean, error: string|null }

## store/slices/userSlice.ts
- Purpose: Manage profile state, fetch/update profile thunks
- Exports: default reducer, actions { setProfile, setUserId, clearProfile }, thunks { fetchProfile, updateUserProfile }
- Key imports: profileAPI

## store/slices/appSlice.ts
- Purpose: App-wide flags like dark mode, online status, app loading
- Exports: default reducer, actions { setDarkMode, setOnline, setAppLoading }

## store/store.ts
- Purpose: Configure store with reducers, middleware, redux-persist
- Exports: `store`, `persistor`, RootState and AppDispatch types
- Key imports: configureStore, persistStore, persistReducer, AsyncStorage, reducers
- Notes: persist auth slice to keep token across restarts

---

## services/api/apiClient.ts
- Purpose: Axios instance with baseURL, request interceptor (attaches token), and response interceptor (401 handling)
- Exports: default `apiClient` (AxiosInstance)
- Key imports: axios, asyncStorageService
- Key behavior: reads `process.env.EXPO_PUBLIC_API_URL` fallback to `http://localhost:5000/api/v1`; automatic Authorization header injection

## services/api/authAPI.ts
- Purpose: Auth endpoints wrapper
- Exports: `authAPI` object with methods: register(data), login(data), logout(), verifyToken(token)
- Key imports: apiClient
- Method params: register({ name, email, password }), login({ email, password })

## services/api/profileAPI.ts
- Purpose: Profile endpoints wrapper
- Exports: `profileAPI` with getProfile() and updateProfile(data)
- Params: updateProfile(UpdateProfileRequest)

## services/api/wardrobeAPI.ts
- Purpose: Wardrobe endpoints wrapper (add/get/suggestions)
- Exports: `wardrobeAPI` with addItem, getWardrobe, getSuggestions, getOccasionSuggestion
- Params: addItem(AddItemRequest), getOccasionSuggestion(occasion?: string)

---

## services/socket/socketClient.ts
- Purpose: Initialize and manage Socket.IO client connection
- Exports: `socketService` with connect(), getSocket(), disconnect(), on(), off(), emit(), isConnected()
- Key imports: socket.io-client, asyncStorageService
- Behavior: uses token from storage for auth; reconnection config provided

## services/socket/socketListeners.ts
- Purpose: High-level registration functions for application to subscribe to domain events
- Exports: `socketListeners` with functions like onScanProgress(cb), onChatResponseChunk(cb), removeAllListeners(), etc.
- Key imports: socketService

---

## services/storage/asyncStorage.ts
- Purpose: Abstraction over AsyncStorage for tokens and user data
- Exports: `asyncStorageService` methods: saveToken, getToken, removeToken, saveRefreshToken, getRefreshToken, saveUser, getUser, removeUser, clearAll
- Key imports: @react-native-async-storage/async-storage
- Notes: Keys are prefixed with `@fashion_app:`; used by apiClient and auth thunks

## services/index.ts
- Purpose: Barrel export for services (re-exports api and socket and storage exports)
- Exports: `*` from submodules

---

## hooks/useAuth.ts
- Purpose: Hook to access auth state and methods (login/register/verify/logout)
- Exports: `useAuth()` returning auth state and helper functions
- Key imports: react-redux useDispatch/useSelector, store types, authSlice thunks
- Returned API: { user, accessToken, isAuthenticated, loading, error, login(credentials), register(data), verify(token), logOut() }

## hooks/useApi.ts
- Purpose: Generic API call wrapper returning { loading, error, request }
- Exports: `useApi()`; `request` expects an async function that performs API call
- Behavior: sets local loading and error states, invokes optional callbacks

## hooks/useSocket.ts
- Purpose: Hook to initialize socket connection and provide emit/on/off wrappers
- Exports: `useSocket()` returning { emit, on, off, isConnected }
- Key imports: socketService, socketListeners

## hooks/index.ts
- Purpose: Barrel export of hooks

---

## types/user.ts
- Exports: `User`, `LoginResponse`, `RegisterRequest`, `LoginRequest`
- Usage: types for auth slice and authAPI

## types/profile.ts
- Exports: `Profile`, `Gender`, `SkinTone`, `UpdateProfileRequest`

## types/wardrobe.ts
- Exports: `ClothingItem`, `Category`, `Formality`, `AddItemRequest`, `Outfit`, `OutfitSuggestion`

## types/api.ts
- Exports: `ApiResponse<T>`, `ApiError`

## types/index.ts
- Re-exports all type files

---

## utils/constants.ts
- Purpose: Central constants like storage keys, option lists, timeouts
- Exports: `constants` object

## utils/validation.ts
- Purpose: Zod schemas and validators for forms (auth, profile, wardrobe)
- Exports: `validationSchemas` used by form components

## utils/formatting.ts
- Purpose: Date/time/currency/percentage helper functions
- Exports: `formatting` object

## utils/helpers.ts
- Purpose: Generic helper functions (isValidEmail, isStrongPassword, generateId, deepClone, delay)
- Exports: `helpers` object

## utils/index.ts
- Barrel export of utils

---

## index/barrel files
- `services/index.ts`, `hooks/index.ts`, `utils/index.ts`, `types/index.ts` simply re-export their submodules to simplify imports.

Example usage in a file:
```ts
import apiClient from '../services/api/apiClient';
import { authAPI } from '../services/api/authAPI';
import { useAuth } from '../hooks'; // from hooks/index.ts
import { User } from '../types';
```

---

## Dependencies (packages needed for all files above)
- core: react, react-native, expo
- navigation: @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
- state: redux, @reduxjs/toolkit, react-redux, redux-persist
- http: axios
- realtime: socket.io-client
- forms/validation: react-hook-form, zod, @hookform/resolvers
- storage: @react-native-async-storage/async-storage
- styling: nativewind, tailwindcss
- utilities: uuid, dotenv
- typings (if using TS): @types/react, @types/react-native as required

---

## Import / Export patterns used
- Screens and components export default or named React components.
- Slices export default reducers, named actions and thunks.
- Services expose plain objects with method functions (e.g., `authAPI.login()`), or named exports.
- Barrel files re-export module sets for short imports (e.g., `import { useAuth } from '../hooks'`).

---

## How to extend or run (minimal steps)
1. Ensure dependencies installed (see list above). Run `npm install` in `my-expo-app`.
2. Set `.env` with EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL.
3. Start Expo: `npm start`.
4. Implement Phase 2 behaviors (token refresh endpoint, profile APIs) where TODOs exist.

---

## Final notes
- This document intentionally focuses only on files inside `src/` and describes their current responsibilities and signatures. It does not repeat implementation details beyond interfaces, props and required dependencies.
- If you want a condensed JSON manifest (file list + exports + imports) or a shell script to print/verify these files, say the word and I will generate it in a single file as well.

---

Generated by GitHub Copilot — overview saved to: `src/FRONTEND_SRC_OVERVIEW.md`
