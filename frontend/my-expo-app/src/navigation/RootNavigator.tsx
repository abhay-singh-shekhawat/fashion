import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootState, AppDispatch } from '../store/store';
import { verifyToken } from '../store/slices/authSlice';
import { fetchProfile } from '../store/slices/userSlice';
import { asyncStorageService } from '../services/storage/asyncStorage';
import { socketService } from '../services/socket/socketClient';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import {SplashScreen} from '../screens/auth/SplashScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Navigation
import { BottomTabNavigator } from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, accessToken, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { hasCompletedProfile } = useSelector(
    (state: RootState) => state.user
  );

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Check for saved token
        const savedToken = await asyncStorageService.getToken();

        if (savedToken) {
          console.log('Found saved token, verifying...');
          // Verify token is still valid
          await dispatch(verifyToken(savedToken)).unwrap();

          // Connect socket
          await socketService.connect();

          // Fetch user profile
          try {
            await dispatch(fetchProfile()).unwrap();
          } catch (profileError) {
            console.log('Profile not yet created');
          }
        }
      } catch (error) {
        console.log('Token verification failed:', error);
        await asyncStorageService.removeToken();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [dispatch]);

  useEffect(() => {
    // Connect socket when authenticated
    if (isAuthenticated) {
      socketService.connect().catch((err) => {
        console.error('Socket connection error:', err);
      });
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  if (isBootstrapping) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'white' },
          }}
        >
          {!isAuthenticated ? (
            // Auth Stack
            <Stack.Group>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Group>
          ) : !hasCompletedProfile ? (
            // Profile Setup
            <Stack.Screen
              name="ProfileSetup"
              component={ProfileScreen}
              options={{
                animationEnabled: false,
              }}
            />
          ) : (
            // Main App Stack
            <Stack.Group>
              <Stack.Screen
                name="MainTabs"
                component={BottomTabNavigator}
                options={{
                  animationEnabled: false,
                }}
              />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default RootNavigator;