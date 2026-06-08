import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import WardrobeScreen from '../screens/main/WardrobeScreen';
import ScanScreen from '../screens/main/ScanScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ShoppingScreen from '../screens/main/ShoppingScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const getTabIcon = (name: string, focused: boolean) => {
  const iconMap: { [key: string]: string } = {
    Home: '🏠',
    Wardrobe: '👔',
    Scan: '📸',
    Chat: '💬',
    Shopping: '🛍️',
    Achievements: '🏆',
    Notifications: '🔔',
    Settings: '⚙️',
    Profile: '👤',
  };

  return (
    <View
      className={`flex-1 items-center justify-center ${
        focused ? 'bg-blue-50' : ''
      }`}
    >
      <Text className="text-2xl">{iconMap[name]}</Text>
    </View>
  );
};

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: ({ focused }) => (
          <Text
            className={`text-xs font-semibold ${
              focused ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => getTabIcon(route.name, focused),
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;