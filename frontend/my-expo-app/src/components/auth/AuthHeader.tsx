import React from 'react';
import { View, Text, Image } from 'react-native';

export const AuthHeader: React.FC = () => {
  return (
    <View className="items-center mb-8 mt-8">
      <Text className="text-3xl font-bold text-gray-900 mb-2">FashionAI</Text>
      <Text className="text-gray-600 text-center">Your AI-Powered Fashion Stylist</Text>
    </View>
  );
};
