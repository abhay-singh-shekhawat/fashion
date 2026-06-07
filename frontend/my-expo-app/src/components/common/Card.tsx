import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, className = '' }) => {
  return (
    <View
      className={`bg-white rounded-lg shadow-sm p-4 ${className}`}
      style={[{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 }, style]}
    >
      {children}
    </View>
  );
};
