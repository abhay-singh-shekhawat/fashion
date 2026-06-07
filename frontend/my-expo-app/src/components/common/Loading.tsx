import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size={size} color="#2563eb" />
      {message && <Text className="mt-4 text-gray-600 text-base">{message}</Text>}
    </View>
  );
};
