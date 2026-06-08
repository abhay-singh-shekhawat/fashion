import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { View, ActivityIndicator } from 'react-native';

import './global.css';

// Suppress specific warnings (optional)
import { LogBox } from 'react-native';

// Suppress non-critical warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
  'AsyncStorage has been extracted from react-native core',
]);

// Persist state rehydration loading screen
const LoadingScreen = () => (
  <View className="flex-1 bg-white items-center justify-center">
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

export default function App() {
  useEffect(() => {
    // Initialize app-wide settings here
    console.log('🚀 FashionAI App Starting...');
    
    // You can add initialization logic here:
    // - Check for app updates
    // - Initialize analytics
    // - Load fonts
    // - Request permissions
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <RootNavigator />
              <StatusBar style="auto" barStyle="dark-content" />
            </ErrorBoundary>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}