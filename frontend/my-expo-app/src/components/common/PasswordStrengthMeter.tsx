import React from 'react';
import { View, Text } from 'react-native';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
}) => {
  const calculateStrength = (
    pwd: string
  ): { score: number; label: string; color: string } => {
    let score = 0;

    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 12) score += 10;
    if (/[a-z]/.test(pwd)) score += 15;
    if (/[A-Z]/.test(pwd)) score += 15;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[!@#$%^&*]/.test(pwd)) score += 20;

    if (score < 40) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score < 70) return { score, label: 'Fair', color: 'bg-yellow-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const { score, label, color } = calculateStrength(password);
  const percentage = (score / 100) * 100;

  const bgColorClass =
    color === 'bg-red-500'
      ? 'bg-red-500'
      : color === 'bg-yellow-500'
        ? 'bg-yellow-500'
        : 'bg-green-500';

  const textColorClass =
    color === 'bg-red-500'
      ? 'text-red-600'
      : color === 'bg-yellow-500'
        ? 'text-yellow-600'
        : 'text-green-600';

  return (
    <View className="my-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs text-gray-600">Password strength</Text>
        <Text className={`text-xs font-semibold ${textColorClass}`}>
          {label}
        </Text>
      </View>
      <View className="h-2 bg-gray-200 rounded overflow-hidden">
        <View
          className={`h-full ${bgColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
};

export default PasswordStrengthMeter;