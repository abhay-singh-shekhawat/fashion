import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import {
  markAsRead,
  deleteNotification,
  markAllAsRead,
  clearAllNotifications,
} from '../../store/slices/notificationSlice';
import NotificationItem from '../../components/common/NotificationItem';
import Button from '../../components/common/Button';

type NotificationsScreenProps = NativeStackScreenProps<any, 'Notifications'>;

export const NotificationsScreen: React.FC<NotificationsScreenProps> = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notification
  );

  // Mock notifications
  const [mockNotifications] = React.useState([
    {
      id: '1',
      type: 'achievement' as const,
      title: 'Achievement Unlocked!',
      message: 'You unlocked the "First Item" achievement',
      icon: '🏆',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'suggestion' as const,
      title: 'Daily Outfit Ready',
      message: 'Check out your personalized outfit for today',
      icon: '💡',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'scan_complete' as const,
      title: 'Scan Complete',
      message: '5 items detected in your outfit',
      icon: '✅',
      read: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: '4',
      type: 'chat' as const,
      title: 'AI Stylist Reply',
      message: 'Your AI stylist replied to your message',
      icon: '💬',
      read: true,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
  ]);

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-gray-800">Notifications</Text>
          {unreadCount > 0 && (
            <Text className="text-red-600 text-sm mt-1">
              {unreadCount} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            className="bg-blue-100 px-3 py-2 rounded"
            onPress={() => dispatch(markAllAsRead())}
          >
            <Text className="text-blue-600 font-semibold text-sm">
              Mark All Read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {displayNotifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-4">🔔</Text>
          <Text className="text-gray-800 font-semibold text-center mb-2">
            No Notifications
          </Text>
          <Text className="text-gray-600 text-center">
            You're all caught up! New notifications will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4 py-2">
              <NotificationItem
                notification={item}
                onMarkAsRead={() => dispatch(markAsRead(item.id))}
                onDelete={() => dispatch(deleteNotification(item.id))}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListFooterComponent={
            displayNotifications.length > 0 ? (
              <View className="px-4 mt-6">
                <Button
                  title="Clear All Notifications"
                  onPress={() => dispatch(clearAllNotifications())}
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;