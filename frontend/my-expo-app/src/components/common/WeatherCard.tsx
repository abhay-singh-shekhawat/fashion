import React from 'react';
import { View, Text } from 'react-native';

interface WeatherCardProps {
  temperature: number;
  weatherFeel: string;
  condition?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  weatherFeel,
  condition = 'Mild',
}) => {
  const getWeatherEmoji = (feel: string) => {
    switch (feel.toLowerCase()) {
      case 'hot':
        return '☀️';
      case 'cold':
        return '❄️';
      case 'rainy':
        return '🌧️';
      case 'mild':
      default:
        return '🌤️';
    }
  };

  return (
    <View className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 mb-6">
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white text-5xl font-bold">{temperature}°</Text>
          <Text className="text-blue-100 text-lg mt-2">
            {condition} & {weatherFeel}
          </Text>
        </View>
        <Text className="text-6xl">{getWeatherEmoji(weatherFeel)}</Text>
      </View>
    </View>
  );
};

export default WeatherCard;