import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/common/Card';

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Home</Text>
          <Text className="text-gray-600 mb-6">Welcome to FashionAI</Text>

          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">Daily Recommendation</Text>
            <Text className="text-gray-600">Your personalized outfit will appear here</Text>
          </Card>

          <Card className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">Quick Stats</Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-2xl font-bold text-blue-600">0</Text>
                <Text className="text-gray-600 text-sm">Points</Text>
              </View>
              <View>
                <Text className="text-2xl font-bold text-blue-600">1</Text>
                <Text className="text-gray-600 text-sm">Level</Text>
              </View>
              <View>
                <Text className="text-2xl font-bold text-blue-600">0</Text>
                <Text className="text-gray-600 text-sm">Streak</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
