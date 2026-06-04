# Fashion App - Frontend Development Plan (Expo React Native)

## Overview
This document outlines a 5-phase approach to building the Expo-based frontend for the Fashion App, a smart outfit recommendation and wardrobe management application.

**Project Stack:**
- Framework: React Native + Expo
- State Management: Redux/Context API
- Navigation: React Navigation (Native Stack + Bottom Tab)
- HTTP Client: Axios
- Real-time: Socket.IO Client
- UI Library: NativeWind (Tailwind CSS for React Native)
- Forms: React Hook Form
- Validation: Zod

---

## Phase 1: Project Setup & Core Infrastructure

### Duration: 1-2 weeks
### Estimated Time: 40-60 hours

### Objectives
1. Initialize Expo project with proper folder structure
2. Set up global state management (Redux or Context API)
3. Configure navigation stack (authentication flow + main app)
4. Set up API client with axios and JWT handling
5. Configure Socket.IO connection
6. Establish design system and UI components
7. Set up environment configuration

### APIs Required
- None (setup phase only)

### Folder Structure to Create
```
frontend/my-expo-app/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── SplashScreen.tsx
│   │   └── main/
│   │       ├── HomeScreen.tsx
│   │       ├── ProfileSetupScreen.tsx
│   │       └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── AuthStackNavigator.tsx
│   │   ├── MainStackNavigator.tsx
│   │   ├── BottomTabNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   └── appSlice.ts
│   │   └── store.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── authAPI.ts
│   │   │   ├── profileAPI.ts
│   │   │   ├── wardrobeAPI.ts
│   │   │   ├── scanAPI.ts
│   │   │   ├── chatAPI.ts
│   │   │   └── suggestionAPI.ts
│   │   ├── socket/
│   │   │   ├── socketClient.ts
│   │   │   └── socketListeners.ts
│   │   └── storage/
│   │       └── asyncStorage.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Toast.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthHeader.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── BottomTabBar.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useSocket.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── profile.ts
│   │   ├── wardrobe.ts
│   │   └── api.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   └── App.tsx
├── app.json
├── app/
│   └── _layout.tsx (Expo Router if using)
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

### Key Files to Create

**1. API Client Setup (`src/services/api/apiClient.ts`)**
- Axios instance with base URL
- Request interceptor (add JWT token)
- Response interceptor (handle 401, refresh token)
- Error handling wrapper

**2. Socket.IO Client (`src/services/socket/socketClient.ts`)**
- Initialize Socket.IO connection with auth
- Reconnection logic
- Event listener registry

**3. Redux Store (`src/store/store.ts`)**
- Configure Redux with auth, user, and app slices
- Persist auth token to AsyncStorage

**4. Navigation Setup (`src/navigation/RootNavigator.tsx`)**
- Auth Stack: Login, Register, Splash screens
- Main Stack: Tabs for Home, Wardrobe, Chat, Profile
- Conditional rendering based on auth state

**5. Custom Hooks**
- `useAuth()` - Access auth state and methods
- `useApi()` - Generic API call wrapper with loading/error
- `useSocket()` - Socket.IO connection and events

### Dependencies to Install
```bash
# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack

# State Management
npm install redux @reduxjs/toolkit react-redux

# HTTP Client
npm install axios

# Real-time
npm install socket.io-client

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Storage
npm install @react-native-async-storage/async-storage

# UI
npm install nativewind tailwindcss

# Image Handling
npm install expo-image-picker

# Other utilities
npm install uuid dotenv
```

### Components/Screens to Build

1. **SplashScreen** - Check auth state on app load
2. **RootNavigator** - Conditional navigation based on auth
3. **CommonComponents** - Button, Input, Card, Modal, Loading, Toast
4. **AuthHeader** - Logo and heading for auth screens

### Environment Configuration

Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
EXPO_PUBLIC_APP_ENV=development
```

### Success Criteria
- ✅ Expo project initialized with proper folder structure
- ✅ Redux store configured with auth state
- ✅ API client with interceptors working
- ✅ Socket.IO connection established (with fallback)
- ✅ Navigation stack structure in place (auth & main tabs)
- ✅ Common UI components created and documented
- ✅ Custom hooks (useAuth, useApi, useSocket) functional
- ✅ All dependencies installed and configured
- ✅ Environment variables set up

---

## Phase 2: Authentication & User Management

### Duration: 1-2 weeks
### Estimated Time: 35-50 hours

### Objectives
1. Implement registration flow with validation
2. Implement login flow with JWT token storage
3. Create profile setup screen (body measurements, preferences)
4. Handle token refresh logic
5. Implement logout functionality
6. Add error handling and user feedback
7. Set up protected route navigation

### APIs Required
- `POST /user/register` - User registration
- `POST /user/login` - User login
- `POST /profile/upload/profile` - Create/update profile
- `GET /profile/get/profile` - Retrieve user profile

### Screens/Components to Build

**1. RegisterScreen**
- Email input with validation
- Password input with strength indicator
- Confirm password field
- Terms & conditions checkbox
- Register button with loading state
- Link to login screen
- Handle registration errors

**2. LoginScreen**
- Email input
- Password input
- Remember me checkbox
- Login button with loading state
- Forgot password link (future enhancement)
- Link to register screen
- Handle login errors

**3. ProfileSetupScreen**
- Height input (cm)
- Weight input (kg)
- Age input
- Gender selector (dropdown)
- Skin tone selector (dropdown)
- Save profile button
- Skip button (optional)
- Form validation
- Success/error feedback

**4. SplashScreen**
- Logo/brand animation
- Check auth token in AsyncStorage
- Verify token validity (try GET profile)
- Redirect to Auth or Main flow

### Services to Implement

**`src/services/api/authAPI.ts`**
```typescript
- register(name, email, password): Promise<User>
- login(email, password): Promise<LoginResponse>
- logout(): Promise<void>
- refreshToken(): Promise<string>
- verifyToken(token): Promise<boolean>
```

**`src/services/api/profileAPI.ts`**
```typescript
- getProfile(): Promise<Profile>
- updateProfile(profileData): Promise<Profile>
```

**`src/services/storage/asyncStorage.ts`**
```typescript
- saveToken(token): Promise<void>
- getToken(): Promise<string | null>
- removeToken(): Promise<void>
- saveRefreshToken(token): Promise<void>
- getRefreshToken(): Promise<string | null>
```

### Redux Slices to Create

**`authSlice.ts`**
- State: user, accessToken, isAuthenticated, loading, error
- Actions: setUser, setToken, logout, setLoading, setError
- Thunks: loginUser, registerUser, verifyToken

**`userSlice.ts`**
- State: profile, userId, preferences
- Actions: setProfile, updateProfile, setUserId
- Thunks: fetchProfile, updateUserProfile

### Error Handling
- Display toast for validation errors
- Handle 401 (unauthorized) - redirect to login
- Handle 400 (bad request) - show field errors
- Handle 500 (server error) - retry mechanism
- Display generic error modal

### Form Validation Rules
**Register:**
- Email: valid format, unique
- Password: min 8 chars, contains uppercase, lowercase, number
- Name: min 2 chars, max 100 chars

**Profile:**
- Height: 100-250 cm
- Weight: 30-200 kg
- Age: 12-100 years
- Gender: required selection
- Skin tone: required selection

### Success Criteria
- ✅ Register screen with full validation
- ✅ Login screen with JWT token handling
- ✅ Token persisted to AsyncStorage
- ✅ Token refresh on 401 error
- ✅ Profile setup screen with all fields
- ✅ Logout clears token and navigates to login
- ✅ Protected routes prevent unauthorized access
- ✅ Error handling with user-friendly messages
- ✅ Loading states on all async operations
- ✅ Splash screen checks auth on app load

---

## Phase 3: Core Features - Main Functionality

### Duration: 2-3 weeks
### Estimated Time: 60-90 hours

### Objectives
1. Build wardrobe management feature
2. Build outfit scanning feature
3. Build chat agent feature
4. Implement real-time progress updates via Socket.IO
5. Display outfit suggestions with weather integration
6. Create outfit rating system UI

### APIs Required
- `POST /wardrobe/add/item` - Add clothing item
- `GET /wardrobe/get/wardrobe` - Get wardrobe
- `GET /wardrobe/get/suggestions` - Get suggestions
- `POST /scan/outfit` - Scan outfit
- `POST /agent/chat` - Chat with AI
- `GET /suggestion/get/occasion/suggestions` - Occasion suggestions
- `GET /suggestion/get/daily/recommendations` - Daily recommendations

### Screens/Components to Build

**1. HomeScreen (Dashboard)**
- Daily outfit recommendation card
- Weather display
- Quick action buttons (Scan, Chat, Browse Wardrobe)
- User stats (Points, Level, Streak)
- Motivational message
- Recent activity
- Refresh capability

**2. WardrobeScreen (Tabs)**
- Tab 1: My Wardrobe
  - Grid/list view of clothing items
  - Add item button
  - Filter by category
  - Filter by color
  - Delete item functionality
  - Item details modal

- Tab 2: Add Item
  - Form with: name, category, color, formality
  - Capture photo (optional)
  - Submit button
  - Success feedback

- Tab 3: Outfit Suggestions
  - Current suggestion card (top + bottom image)
  - Suggestion details (weather fit, reason)
  - Refresh button
  - Occasion selector
  - Save outfit to favorites (future)

**3. ScanScreen**
- Camera preview or image picker
- Take photo / Choose from gallery buttons
- Preview of selected image
- Scan button
- Real-time progress indicator with messages:
  - "Uploading image..." (30%)
  - "Detecting items..." (60%)
  - "Analyzing colors..." (80%)
  - "Complete!" (100%)
- Detected items display:
  - Item type, color, confidence score
  - Formality level
  - Number of layers
- Save to wardrobe button
- Back button

**4. ChatScreen**
- Chat message list (bubbles)
- Message input with send button
- Typing indicator
- Message timestamps
- Streaming response display (word by word)
- Suggested quick prompts:
  - "What should I wear today?"
  - "Outfit for office meeting"
  - "Gym wear suggestions"
  - "Party outfit ideas"
- Clear chat button
- Chat history (optional)

**5. ProfileScreen**
- User info display (name, email)
- Profile stats:
  - Level and points
  - Outfit suggestions count
  - Wardrobe size
  - Current streak
- Edit profile button
- Change password (future)
- Logout button
- Settings link

### Services to Implement

**`src/services/api/wardrobeAPI.ts`**
```typescript
- addItem(itemData): Promise<ClothingItem>
- getWardrobe(): Promise<ClothingItem[]>
- getWardbobeSuggestions(): Promise<Outfit>
- getOccasionSuggestion(occasion): Promise<OutfitSuggestion>
- deleteItem(itemId): Promise<void>
```

**`src/services/api/scanAPI.ts`**
```typescript
- scanOutfit(imageFile): Promise<ScanResult>
- getScanProgress(jobId): Promise<ScanProgress>
```

**`src/services/api/chatAPI.ts`**
```typescript
- sendMessage(userId, message, image?): Promise<ChatResponse>
```

**`src/services/api/suggestionAPI.ts`**
```typescript
- getDailyRecommendations(): Promise<Recommendation>
- getOccasionSuggestions(occasion): Promise<OutfitSuggestion[]>
- getShoppingSuggestions(): Promise<ShoppingAdvice>
```

### Socket.IO Event Listeners

**In `socketListeners.ts`:**
```typescript
- onScanProgress(callback) - Update UI with scan progress
- onScanComplete(callback) - Display detected items
- onChatChunk(callback) - Append to chat message
- onChatComplete(callback) - Mark message as complete
- onRatingUpdate(callback) - Update rating scores
- onNotification(callback) - Show notifications
```

### State Management (Redux)

**`wardrobeSlice.ts`**
- State: items, loading, error, selectedItem
- Actions: setItems, addItem, removeItem, selectItem
- Thunks: fetchWardrobe, addClothingItem, deleteClothingItem

**`scanSlice.ts`**
- State: isScanning, progress, detectedItems, error
- Actions: startScan, updateProgress, setScanResults, setScanError
- Thunks: performScan

**`chatSlice.ts`**
- State: messages, isTyping, loading, error
- Actions: addMessage, setTyping, clearChat
- Thunks: sendChatMessage

**`suggestionSlice.ts`**
- State: dailyRecommendation, occasionSuggestions, loading
- Actions: setDailyRecommendation, setOccasionSuggestions
- Thunks: fetchDailyRecommendation, fetchOccasionSuggestions

### UI Components to Create

**Image/Outfit Display**
- ClothingItemCard - Display single item with image
- OutfitCard - Display top + bottom combination
- WeatherCard - Show current weather
- ProgressBar - Scan/loading progress

**Forms**
- AddItemForm - Input fields with validation
- OccasionSelector - Dropdown or button group
- ChatInput - Message input with send

**Lists**
- WardrobeGrid - Responsive grid of items
- MessageList - Chat messages with auto-scroll
- SuggestionList - List of multiple outfit suggestions

### Real-time Updates (Socket.IO)

1. **Scan Progress:**
   - Emit: `scan:start`
   - Listen: `scan:progress`, `scan:items:detected`, `scan:complete`

2. **Chat Streaming:**
   - Emit: `chat:message`
   - Listen: `chat:start`, `chat:response:chunk`, `chat:response:complete`

3. **Rating Updates:**
   - Listen: `rating:weather:done`, `rating:skintone:done`, `rating:complete`

### Error Handling
- Network error fallback UI
- Retry mechanism for failed API calls
- User-friendly error messages
- Offline mode detection

### Success Criteria
- ✅ Wardrobe feature fully functional (add, view, delete)
- ✅ Scanning feature with real-time progress
- ✅ Chat interface with streaming responses
- ✅ Suggestion screens for occasions and daily wear
- ✅ Socket.IO real-time updates working
- ✅ All forms have validation
- ✅ Loading and error states on all screens
- ✅ Images displaying correctly
- ✅ Navigation between all screens smooth
- ✅ User stats/level system displaying correctly

---

## Phase 4: Secondary Features & Enhancement

### Duration: 1-2 weeks
### Estimated Time: 30-45 hours

### Objectives
1. Implement shopping suggestions feature
2. Add user progress/achievement system
3. Implement notifications system
4. Add search and filter functionality
5. Create settings screen
6. Implement favorites/saved outfits
7. Optimize performance and UX
8. Add offline capabilities

### APIs Required
- `GET /suggestion/get/shopping` - Shopping suggestions
- Additional rating and progress endpoints

### Screens/Components to Build

**1. ShoppingScreen**
- Wardrobe gaps analysis
- Recommended items to buy
- Category-wise suggestions
- Budget-friendly options
- Brand recommendations (future)
- Save item for later functionality

**2. AchievementsScreen**
- Achievement badges display
- Level progression
- Points breakdown by category
- Leaderboard (future)
- Unlock conditions

**3. NotificationsScreen**
- List of notifications
- Filter by type (achievement, suggestion, scan complete)
- Mark as read
- Delete notifications
- Notification preferences

**4. SettingsScreen**
- Profile settings
- Notification preferences
- Theme selection (light/dark)
- Privacy settings
- Data export (future)
- Feedback form
- App version

### Components to Build

**1. AchievementBadge**
- Badge icon
- Achievement name
- Description
- Unlock date
- Points awarded

**2. NotificationItem**
- Notification type icon
- Title and message
- Timestamp
- Action button
- Swipe to dismiss

**3. SuggestionCard**
- Product image (or placeholder)
- Product name
- Price (if available)
- "Add to wishlist" button
- "View details" link

**4. ProgressBar**
- Level indicator
- Points to next level
- Visual progress bar

### Redux Slices to Create

**`progressSlice.ts`**
- State: points, level, achievements, streak
- Actions: updateProgress, addAchievement
- Thunks: fetchProgress

**`notificationSlice.ts`**
- State: notifications, unreadCount
- Actions: addNotification, markAsRead, deleteNotification
- Thunks: fetchNotifications

### Features to Implement

**1. Search & Filter**
- Search wardrobe by item name
- Filter by category, color, formality
- Sort by date added, name

**2. Favorites System**
- Save favorite outfits
- View saved outfits
- Quick access to frequently used combinations

**3. Offline Mode**
- Cache wardrobe locally
- Display cached data when offline
- Sync when online
- Indicator for offline state

**4. Push Notifications** (if time permits)
- Local notifications for achievements
- Scheduled daily recommendation reminders
- Scan complete notifications

### UI Enhancements
- Haptic feedback on actions
- Smooth animations
- Loading skeleton screens
- Better error boundaries
- Accessibility improvements

### Performance Optimization
- Image lazy loading
- List virtualization for large datasets
- Memoization of components
- Redux selector optimization
- Socket.IO connection pooling

### Success Criteria
- ✅ Shopping suggestions screen functional
- ✅ Progress/achievement system displaying
- ✅ Notifications system working
- ✅ Search and filter working
- ✅ Settings screen functional
- ✅ Offline mode partially working
- ✅ Performance improvements noticeable
- ✅ UI animations smooth
- ✅ No console errors or warnings

---

## Phase 5: Testing, Performance & Deployment

### Duration: 1-2 weeks
### Estimated Time: 40-60 hours

### Objectives
1. Comprehensive unit testing
2. Integration testing
3. E2E testing of critical flows
4. Performance profiling and optimization
5. Security review
6. Build and test production APK/IPA
7. App Store Connect setup (iOS)
8. Google Play Console setup (Android)
9. Final bug fixes and polish
10. Deployment preparation

### Testing Strategy

**1. Unit Tests**
- Components: Render tests, prop validation
- Hooks: useAuth, useApi, useSocket
- Utils: Validation, formatting, helpers
- Redux: Reducers, selectors, thunks
- Target: 70%+ coverage

**2. Integration Tests**
- Auth flow: Register → Login → Profile Setup
- Wardrobe flow: Add Item → View → Suggest
- Chat flow: Message → Response → Display
- Real-time: Socket events and UI updates

**3. E2E Tests**
- Complete user journey (Onboarding to outfit suggestion)
- Error scenarios (Network failure, API errors)
- Edge cases (Empty wardrobe, no profile)

### Testing Tools
```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev detox detox-cli
```

### Performance Optimization

**Metrics to Measure:**
- App start time
- Screen load time
- API response time
- Memory usage
- Battery consumption
- Network usage

**Optimization Tasks:**
- Image compression and lazy loading
- Redux selector optimization
- Component memoization (React.memo, useMemo)
- Socket.IO connection optimization
- Remove unused dependencies
- Code splitting
- Bundle size analysis

### Security Review

**Checklist:**
- JWT token storage security (AsyncStorage vs SecureStore)
- API endpoint HTTPS
- No hardcoded credentials
- Password validation strength
- API key rotation
- CORS headers correct
- Rate limiting in place
- Input validation on all forms
- SQL injection prevention (backend)
- XSS prevention

### Production Build

**iOS:**
1. Create Apple Developer account
2. Configure certificates and provisioning profiles
3. Build with `eas build --platform ios --auto-submit`
4. Prepare for App Store submission

**Android:**
1. Create Google Play Developer account
2. Generate signed APK/AAB
3. Build with `eas build --platform android`
4. Prepare for Play Store submission

### Deployment Checklist

**Pre-Deployment:**
- [ ] All features tested and working
- [ ] Zero critical bugs
- [ ] Performance acceptable
- [ ] All endpoints documented
- [ ] Error handling complete
- [ ] Analytics integrated (optional)
- [ ] Privacy policy ready
- [ ] Terms of service ready
- [ ] Support contact info available
- [ ] Version number bumped

**Deployment:**
- [ ] Deploy to TestFlight (iOS)
- [ ] Deploy to Google Play Beta (Android)
- [ ] Gather feedback
- [ ] Fix issues
- [ ] Release to production

### Success Criteria
- ✅ Unit test coverage 70%+
- ✅ Critical flows tested end-to-end
- ✅ Performance metrics acceptable
- ✅ Security review passed
- ✅ Production build created successfully
- ✅ App Store Connect app created
- ✅ Google Play app created
- ✅ Beta testing completed
- ✅ Final bug fixes applied
- ✅ Ready for app store release

---

## Technology Stack Summary

| Category | Technology |
|----------|-----------|
| **Mobile Framework** | React Native + Expo |
| **State Management** | Redux Toolkit + Redux Persist |
| **Navigation** | React Navigation |
| **HTTP Client** | Axios |
| **Real-time Communication** | Socket.IO Client |
| **Forms & Validation** | React Hook Form + Zod |
| **UI Framework** | NativeWind (Tailwind CSS) |
| **Styling** | CSS + Tailwind Utilities |
| **Image Handling** | Expo Image Picker + Expo Image |
| **Storage** | AsyncStorage (+ SecureStore for sensitive data) |
| **Testing** | Jest + React Testing Library + Detox |
| **Build & Deploy** | Expo EAS |
| **TypeScript** | Yes (all code) |
| **Environment Mgmt** | dotenv |

---

## Key Milestones

| Phase | Duration | Key Deliverables | Status |
|-------|----------|-----------------|--------|
| **Phase 1** | 1-2 weeks | Project structure, navigation, UI components | Pending |
| **Phase 2** | 1-2 weeks | Auth screens, token management, profile setup | Pending |
| **Phase 3** | 2-3 weeks | Wardrobe, Scan, Chat, Suggestions | Pending |
| **Phase 4** | 1-2 weeks | Shopping, Achievements, Notifications, Offline | Pending |
| **Phase 5** | 1-2 weeks | Testing, deployment, app store release | Pending |

---

## Estimated Total Timeline

- **Best Case:** 6-8 weeks
- **Realistic Case:** 8-12 weeks
- **With buffer:** 12-16 weeks

---

## Team Requirements

| Role | Responsibilities | Time |
|------|-----------------|------|
| **React Native Developer** | All frontend development | Full-time |
| **Backend Developer** | API maintenance, bug fixes | Part-time (as needed) |
| **QA Engineer** | Testing, bug reporting | Part-time |
| **DevOps** | Deployment, CI/CD | Part-time |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Scope creep | High | Strict phase boundaries, feature prioritization |
| Performance issues | Medium | Regular profiling, optimization checkpoints |
| API changes | Medium | Versioned API, backward compatibility |
| User adoption | Low | Beta testing feedback, UX improvements |
| Deployment issues | High | Staging environment, automated testing |

---

## Success Criteria (Overall)

- ✅ All 5 phases completed on schedule
- ✅ App functional on iOS and Android
- ✅ All critical features working
- ✅ Performance acceptable (app start < 3s)
- ✅ 95%+ uptime
- ✅ User-friendly error messages
- ✅ Real-time features working smoothly
- ✅ Authentication secure
- ✅ Ready for app store release

