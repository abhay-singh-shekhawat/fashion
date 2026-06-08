import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import { fetchShoppingAdvice } from '../../store/slices/suggestionSlice';
import SuggestionCard from '../../components/common/SuggestionCard';
import Button from '../../components/common/Button';

type ShoppingScreenProps = NativeStackScreenProps<any, 'Shopping'>;

export const ShoppingScreen: React.FC<ShoppingScreenProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { shoppingAdvice, loading } = useSelector(
    (state: RootState) => state.suggestion
  );
  const { itemCount } = useSelector((state: RootState) => state.wardrobe);

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadShoppingAdvice();
  }, []);

  const loadShoppingAdvice = async () => {
    try {
      await dispatch(fetchShoppingAdvice()).unwrap();
    } catch (error) {
      console.log('Error loading shopping advice:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadShoppingAdvice();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const mockShoppingItems = [
    {
      title: 'Navy Blazer',
      description: 'Professional look for office occasions',
      icon: '🧥',
      tags: ['formal', 'office', 'essential'],
      price: '$89.99',
    },
    {
      title: 'White Dress Shirt',
      description: 'Versatile formal piece for any occasion',
      icon: '👕',
      tags: ['formal', 'versatile'],
      price: '$49.99',
    },
    {
      title: 'Black Jeans',
      description: 'Comfortable everyday wear',
      icon: '👖',
      tags: ['casual', 'everyday'],
      price: '$59.99',
    },
    {
      title: 'Neutral Sweater',
      description: 'Perfect for layering in any season',
      icon: '🧶',
      tags: ['casual', 'layering'],
      price: '$39.99',
    },
    {
      title: 'Summer Dress',
      description: 'Light and breathable for hot days',
      icon: '👗',
      tags: ['summer', 'casual'],
      price: '$69.99',
    },
  ];

  if (loading && !shoppingAdvice) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">Shopping Guide</Text>
          <Text className="text-gray-600 mt-1">
            Find items to complete your wardrobe
          </Text>
        </View>

        <View className="px-6 py-6">
          {/* Wardrobe Analysis */}
          {shoppingAdvice && (
            <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    Your Wardrobe
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {shoppingAdvice.wardrobeSize} items
                  </Text>
                </View>
                <View className="bg-blue-100 rounded-full w-16 h-16 items-center justify-center">
                  <Text className="text-3xl font-bold text-blue-600">
                    {Math.floor(
                      (shoppingAdvice.wardrobeSize / 50) * 100
                    )}%
                  </Text>
                </View>
              </View>

              <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <View
                  className="h-full bg-blue-500"
                  style={{
                    width: `${Math.min(
                      (shoppingAdvice.wardrobeSize / 50) * 100,
                      100
                    )}%`,
                  }}
                />
              </View>

              <Text className="text-sm text-gray-600">
                Good start! Keep adding to build a complete wardrobe.
              </Text>
            </View>
          )}

          {/* Gaps Analysis */}
          {shoppingAdvice && shoppingAdvice.gaps.length > 0 && (
            <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <Text className="text-lg font-bold text-orange-900 mb-3">
                Wardrobe Gaps
              </Text>
              {shoppingAdvice.gaps.map((gap, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Text className="text-orange-600 mr-3">▪</Text>
                  <Text className="text-orange-800 text-sm flex-1">{gap}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended Items */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Recommended Items
            </Text>

            {mockShoppingItems.map((item, index) => (
              <SuggestionCard
                key={index}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tags={item.tags}
                price={item.price}
                onAddToWishlist={() => {
                  console.log('Added to wishlist:', item.title);
                }}
              />
            ))}
          </View>

          {/* View More Button */}
          <Button
            title="Browse All Items"
            onPress={() => console.log('Browse all items')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShoppingScreen;