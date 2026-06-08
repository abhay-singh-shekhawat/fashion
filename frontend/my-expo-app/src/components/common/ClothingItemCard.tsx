import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { ClothingItem } from '../../services/api/wardrobeAPI';

interface ClothingItemCardProps {
  item: ClothingItem;
  onSelect?: (item: ClothingItem) => void;
  onDelete?: (itemId: string) => void;
  isSelectable?: boolean;
}

export const ClothingItemCard: React.FC<ClothingItemCardProps> = ({
  item,
  onSelect,
  onDelete,
  isSelectable = false,
}) => {
  const handleDelete = () => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(item._id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-lg overflow-hidden shadow-md mb-4"
      onPress={() => onSelect?.(item)}
      disabled={!isSelectable}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-40 bg-gray-200"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800">{item.name}</Text>

        <View className="flex-row justify-between mt-2">
          <View>
            <Text className="text-xs text-gray-600">Category</Text>
            <Text className="text-sm font-semibold text-gray-800 capitalize">
              {item.category}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-600">Color</Text>
            <View className="flex-row items-center mt-1">
              <View
                className="w-4 h-4 rounded-full mr-2"
                style={{
                  backgroundColor: item.color.toLowerCase(),
                }}
              />
              <Text className="text-sm font-semibold text-gray-800 capitalize">
                {item.color}
              </Text>
            </View>
          </View>
          <View>
            <Text className="text-xs text-gray-600">Formality</Text>
            <Text className="text-sm font-semibold text-gray-800 capitalize">
              {item.formality}
            </Text>
          </View>
        </View>

        {onDelete && (
          <TouchableOpacity
            className="bg-red-100 mt-3 py-2 px-4 rounded"
            onPress={handleDelete}
          >
            <Text className="text-red-600 font-semibold text-center">
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ClothingItemCard;