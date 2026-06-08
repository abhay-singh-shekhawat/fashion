import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import {
  fetchDailyRecommendation,
  fetchShoppingAdvice,
} from '../../store/slices/suggestionSlice';
import { fetchWardrobe } from '../../store/slices/wardrobeSlice';
import { fetchProfile } from '../../store/slices/userSlice';
import WeatherCard from '../../components/common/WeatherCard';
import OutfitCard from '../../components/common/OutfitCard';

type HomeScreenProps = NativeStackScreenProps<any, 'Home'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { dailyRecommendation, loading: suggestionLoading } = useSelector(
    (state: RootState) => state.suggestion
  );
  const { itemCount } = useSelector((state: RootState) => state.wardrobe);
  const { profile } = useSelector((state: RootState) => state.user);

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      await dispatch(fetchDailyRecommendation()).unwrap();
      await dispatch(fetchWardrobe()).unwrap();
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.log('Error loading home data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHomeData();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  if (suggestionLoading && !dailyRecommendation) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  const temperature = dailyRecommendation?.responseData?.temperature || 22;
  const weatherFeel =
    dailyRecommendation?.responseData?.weatherFeel || 'mild';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-3xl font-bold text-gray-800">
            Good Morning!
          </Text>
          <Text className="text-gray-600 mt-1">
            {profile?.name || 'User'}
          </Text>
        </View>

        <View className="px-6 py-6">
          {/* Weather Card */}
          <WeatherCard
            temperature={temperature}
            weatherFeel={weatherFeel}
            condition="Today"
          />

          {/* Daily Recommendation */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Today's Outfit
            </Text>

            {dailyRecommendation ? (
              <View>
                <OutfitCard
                  outfit={{}}
                  suggestion={
                    dailyRecommendation.responseData.recommendation.message
                  }
                  weatherFit={
                    dailyRecommendation.responseData.recommendation.message
                  }
                />
              </View>
            ) : (
              <View className="bg-white rounded-lg p-4">
                <Text className="text-gray-600">
                  Add items to your wardrobe to get recommendations
                </Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity
              className="flex-1 bg-white rounded-lg p-4 shadow-sm"
              onPress={() => navigation.navigate('Wardrobe')}
            >
              <Text className="text-3xl font-bold text-blue-600">
                {itemCount}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-lg p-4 shadow-sm"
              onPress={() => navigation.navigate('Scan')}
            >
              <Text className="text-3xl font-bold text-green-600">0</Text>
              <Text className="text-gray-600 text-sm mt-1">Scans Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-lg p-4 shadow-sm"
              onPress={() => navigation.navigate('Chat')}
            >
              <Text className="text-3xl font-bold text-purple-600">∞</Text>
              <Text className="text-gray-600 text-sm mt-1">Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View>
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Quick Actions
            </Text>

            <TouchableOpacity
              className="bg-blue-500 rounded-lg py-4 px-6 mb-3 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Scan')}
            >
              <Text className="text-white font-semibold text-lg">📸 Scan Outfit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-purple-500 rounded-lg py-4 px-6 mb-3 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Chat')}
            >
              <Text className="text-white font-semibold text-lg">💬 Chat with AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-500 rounded-lg py-4 px-6 flex-row items-center justify-center"
              onPress={() => navigation.navigate('Wardrobe')}
            >
              <Text className="text-white font-semibold text-lg">👔 Manage Wardrobe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;