import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Notification } from '../../store/slices/notificationSlice';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      achievement: '🏆',
      suggestion: '💡',
      scan_complete: '✅',
      chat: '💬',
      general: 'ℹ️',
    };
    return iconMap[type] || 'ℹ️';
  };

  const getNotificationColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      achievement: 'bg-yellow-50 border-yellow-200',
      suggestion: 'bg-blue-50 border-blue-200',
      scan_complete: 'bg-green-50 border-green-200',
      chat: 'bg-purple-50 border-purple-200',
      general: 'bg-gray-50 border-gray-200',
    };
    return colorMap[type] || 'bg-gray-50 border-gray-200';
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(notification.id),
      },
    ]);
  };

  return (
    <View
      className={`border rounded-lg p-4 mb-3 flex-row items-start ${getNotificationColor(
        notification.type
      )}`}
    >
      {/* Icon */}
      <Text className="text-2xl mr-4">
        {getNotificationIcon(notification.type)}
      </Text>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="font-bold text-gray-800">
              {notification.title}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              {notification.message}
            </Text>
          </View>

          {!notification.read && (
            <View className="w-3 h-3 bg-blue-500 rounded-full ml-2" />
          )}
        </View>

        {/* Timestamp */}
        <Text className="text-xs text-gray-500 mt-2">
          {new Date(notification.createdAt).toLocaleTimeString()}
        </Text>

        {/* Actions */}
        <View className="flex-row mt-3 gap-2">
          {!notification.read && (
            <TouchableOpacity
              className="bg-blue-500 rounded px-3 py-1"
              onPress={() => onMarkAsRead?.(notification.id)}
            >
              <Text className="text-white text-xs font-semibold">Mark Read</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-red-500 rounded px-3 py-1"
            onPress={handleDelete}
          >
            <Text className="text-white text-xs font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default NotificationItem;