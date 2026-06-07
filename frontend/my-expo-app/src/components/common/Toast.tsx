import React, { useEffect, useState } from 'react';
import { Animated, View, Text } from 'react-native';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, fadeAnim, onDismiss]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={`${getBackgroundColor()} rounded-lg p-4 mx-4 mb-4 flex-row items-center`}
    >
      <Text className="text-white font-semibold flex-1">{message}</Text>
    </Animated.View>
  );
};
