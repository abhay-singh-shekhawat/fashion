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
import {
  fetchUserProgress,
  fetchAchievements,
} from '../../store/slices/progressSlice';
import AchievementBadge from '../../components/common/AchievementBadge';
import ProgressBar from '../../components/common/ProgressBar';

type AchievementsScreenProps = NativeStackScreenProps<any, 'Achievements'>;

export const AchievementsScreen: React.FC<AchievementsScreenProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    points,
    level,
    totalScans,
    totalOutfitsRated,
    achievements,
    nextLevelPoints,
    loading,
  } = useSelector((state: RootState) => state.progress);

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await dispatch(fetchUserProgress()).unwrap();
      await dispatch(fetchAchievements()).unwrap();
    } catch (error) {
      console.log('Error loading progress:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const progressPercentage = Math.min((points / nextLevelPoints) * 100, 100);

  const mockAchievements = [
    {
      _id: '1',
      userId: 'user1',
      title: 'First Item',
      description: 'Add your first clothing item',
      icon: '👔',
      pointsReward: 10,
      unlockedAt: new Date().toISOString(),
    },
    {
      _id: '2',
      userId: 'user1',
      title: 'Wardrobe Master',
      description: 'Add 20 items to your wardrobe',
      icon: '👗',
      pointsReward: 50,
      unlockedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      userId: 'user1',
      title: 'Chat Expert',
      description: 'Send 10 messages to the AI stylist',
      icon: '💬',
      pointsReward: 30,
      unlockedAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const lockedAchievements = [
    {
      _id: '4',
      userId: 'user1',
      title: 'Scan Specialist',
      description: 'Scan 10 outfits',
      icon: '📸',
      pointsReward: 40,
      unlockedAt: '',
    },
    {
      _id: '5',
      userId: 'user1',
      title: 'Fashion Forward',
      description: 'Reach level 5',
      icon: '✨',
      pointsReward: 100,
      unlockedAt: '',
    },
    {
      _id: '6',
      userId: 'user1',
      title: 'Week Streak',
      description: 'Use the app 7 days in a row',
      icon: '🔥',
      pointsReward: 60,
      unlockedAt: '',
    },
  ];

  if (loading) {
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
          <Text className="text-2xl font-bold text-gray-800">Achievements</Text>
          <Text className="text-gray-600 mt-1">Track your progress</Text>
        </View>

        <View className="px-6 py-6">
          {/* Level Card */}
          <View className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 mb-6 shadow-md">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white text-sm font-semibold opacity-90">
                  CURRENT LEVEL
                </Text>
                <Text className="text-5xl font-bold text-white mt-2">
                  {level}
                </Text>
              </View>
              <View className="bg-white bg-opacity-20 rounded-full w-24 h-24 items-center justify-center">
                <Text className="text-5xl">⭐</Text>
              </View>
            </View>

            <View className="bg-white bg-opacity-20 rounded-lg p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-semibold">{points} pts</Text>
                <Text className="text-white text-opacity-80">
                  {nextLevelPoints} pts to Level {level + 1}
                </Text>
              </View>
              <View className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-white"
                  style={{ width: `${progressPercentage}%` }}
                />
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-3xl font-bold text-blue-600">
                {totalScans}
              </Text>
              <Text className="text-sm text-gray-600 mt-2">Outfits Scanned</Text>
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 shadow-sm">
              <Text className="text-3xl font-bold text-green-600">
                {totalOutfitsRated}
              </Text>
              <Text className="text-sm text-gray-600 mt-2">Outfits Rated</Text>
            </View>
          </View>

          {/* Unlocked Achievements */}
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Unlocked Achievements ({mockAchievements.length})
          </Text>

          {mockAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement._id}
              achievement={achievement}
              unlocked={true}
            />
          ))}

          {/* Locked Achievements */}
          <Text className="text-xl font-bold text-gray-800 mb-4 mt-6">
            Locked Achievements ({lockedAchievements.length})
          </Text>

          {lockedAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement._id}
              achievement={achievement}
              unlocked={false}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AchievementsScreen;