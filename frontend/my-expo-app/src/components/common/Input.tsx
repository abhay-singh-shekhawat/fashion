import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 font-semibold mb-2">{label}</Text>}
      <TextInput
        {...props}
        className={`border ${
          error ? 'border-red-500' : 'border-gray-300'
        } bg-white rounded-lg px-4 py-3 text-gray-900`}
        placeholderTextColor="#999"
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
};
