import React from 'react';
import { View, Text } from 'react-native';
import { Achievement } from '../../services/api/profileAPI';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  unlocked = true,
}) => {
  const getAchievementEmoji = (title: string) => {
    const emojiMap: { [key: string]: string } = {
      'First Item': '👔',
      'Wardrobe Master': '👗',
      'Scan Specialist': '📸',
      'Chat Expert': '💬',
      'Fashion Forward': '✨',
      'Level 5': '⭐',
      'Week Streak': '🔥',
    };
    return emojiMap[title] || '🏆';
  };

  return (
    <View
      className={`items-center mb-6 ${!unlocked ? 'opacity-50' : ''}`}
    >
      <View
        className={`w-24 h-24 rounded-full items-center justify-center mb-3 ${
          unlocked ? 'bg-yellow-100' : 'bg-gray-200'
        }`}
      >
        <Text className="text-5xl">
          {getAchievementEmoji(achievement.title)}
        </Text>
      </View>

      <Text className="text-lg font-bold text-gray-800 text-center">
        {achievement.title}
      </Text>

      <Text className="text-sm text-gray-600 text-center mt-2 max-w-xs">
        {achievement.description}
      </Text>

      <View className="flex-row items-center mt-3 bg-blue-50 rounded-full px-3 py-1">
        <Text className="text-yellow-600 font-bold mr-1">+</Text>
        <Text className="text-blue-600 font-semibold">
          {achievement.pointsReward} pts
        </Text>
      </View>

      {unlocked && (
        <Text className="text-xs text-gray-500 mt-3">
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
};

export default AchievementBadge;