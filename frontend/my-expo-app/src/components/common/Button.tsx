import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: (event?: any) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  className = '',
}) => {
  const isDisabled = disabled || loading;

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600';
      case 'secondary':
        return 'bg-gray-400';
      case 'danger':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2';
      case 'md':
        return 'px-4 py-3';
      case 'lg':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${getVariantStyle()} ${getSizeStyle()} rounded-lg items-center justify-center ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base" style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
