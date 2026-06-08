import React from 'react';
import { View, Text, Image } from 'react-native';
import { Outfit } from '../../services/api/wardrobeAPI';

interface OutfitCardProps {
  outfit: Outfit;
  suggestion?: string;
  weatherFit?: string;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  suggestion,
  weatherFit,
}) => {
  return (
    <View className="bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Outfit Preview */}
      <View className="flex-row bg-gray-100 p-4 min-h-40">
        <View className="flex-1 items-center justify-center">
          {outfit.top ? (
            <Image
              source={{ uri: outfit.top.imageUrl || 'https://via.placeholder.com/100' }}
              className="w-20 h-20 bg-white rounded"
              resizeMode="contain"
            />
          ) : (
            <View className="w-20 h-20 bg-gray-300 rounded items-center justify-center">
              <Text className="text-xs text-gray-600">Top</Text>
            </View>
          )}
        </View>

        <View className="flex-1 items-center justify-center">
          {outfit.bottom ? (
            <Image
              source={{ uri: outfit.bottom.imageUrl || 'https://via.placeholder.com/100' }}
              className="w-20 h-20 bg-white rounded"
              resizeMode="contain"
            />
          ) : (
            <View className="w-20 h-20 bg-gray-300 rounded items-center justify-center">
              <Text className="text-xs text-gray-600">Bottom</Text>
            </View>
          )}
        </View>
      </View>

      {/* Details */}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800 mb-2">Your Outfit</Text>

        {outfit.top && (
          <Text className="text-sm text-gray-700">
            👕 <Text className="font-semibold">{outfit.top.name}</Text>
          </Text>
        )}

        {outfit.bottom && (
          <Text className="text-sm text-gray-700">
            👖 <Text className="font-semibold">{outfit.bottom.name}</Text>
          </Text>
        )}

        {outfit.footwear && (
          <Text className="text-sm text-gray-700">
            👟 <Text className="font-semibold">{outfit.footwear.name}</Text>
          </Text>
        )}

        {weatherFit && (
          <Text className="text-sm text-blue-600 font-semibold mt-3">
            ✓ {weatherFit}
          </Text>
        )}

        {suggestion && (
          <Text className="text-sm text-gray-600 mt-2 italic">
            "{suggestion}"
          </Text>
        )}
      </View>
    </View>
  );
};

export default OutfitCard;