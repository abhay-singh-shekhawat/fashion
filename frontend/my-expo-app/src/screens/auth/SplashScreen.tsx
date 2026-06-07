import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { asyncStorageService } from '../../services/storage/asyncStorage';

type Props = {
  navigation: any;
};

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { verify } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await asyncStorageService.getToken();
        if (token) {
          // Verify token is still valid
          await verify(token);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, [verify]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
};
