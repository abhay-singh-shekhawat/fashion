import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';

interface SuggestionCardProps {
  title: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  onPress?: () => void;
  onAddToWishlist?: () => void;
  tags?: string[];
  price?: string;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  title,
  description,
  icon = '👔',
  imageUrl,
  onPress,
  onAddToWishlist,
  tags = [],
  price,
}) => {
  return (
    <TouchableOpacity
      className="bg-white rounded-lg overflow-hidden shadow-md mb-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image or Icon */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-40 bg-gray-200"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 items-center justify-center">
          <Text className="text-6xl">{icon}</Text>
        </View>
      )}

      {/* Content */}
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800">
              {title}
            </Text>
            {price && (
              <Text className="text-sm text-green-600 font-semibold mt-1">
                {price}
              </Text>
            )}
          </View>
        </View>

        <Text className="text-sm text-gray-600 mb-3">
          {description}
        </Text>

        {/* Tags */}
        {tags.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <View key={index} className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-xs text-gray-700 font-semibold">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          className="bg-blue-500 rounded-lg py-2 px-4 items-center"
          onPress={onAddToWishlist}
        >
          <Text className="text-white font-semibold">Add to Wishlist ♡</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default SuggestionCard;