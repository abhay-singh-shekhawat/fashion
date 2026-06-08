import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showLabel = true,
  height = 8,
  color = 'bg-blue-500',
}) => {
  const percentage = Math.min(Math.max(progress, 0), 100);

  return (
    <View className="mb-4">
      {showLabel && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-semibold text-gray-700">
            {label || 'Progress'}
          </Text>
          <Text className="text-sm font-semibold text-gray-600">
            {percentage}%
          </Text>
        </View>
      )}

      <View className="h-2 bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <View
          className={`${color} rounded-full`}
          style={{ width: `${percentage}%`, height: '100%' }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;