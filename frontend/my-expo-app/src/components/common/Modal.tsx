import React from 'react';
import { Modal, View, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="bg-white rounded-lg w-4/5 p-6">
          <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>
          <Text className="text-gray-600 mb-6">{message}</Text>

          <View className="flex-row justify-end gap-3">
            {onCancel && (
              <TouchableOpacity onPress={onCancel} className="px-4 py-2">
                <Text className="text-blue-600 font-semibold">{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onConfirm}
              className={`px-4 py-2 rounded-lg ${isDangerous ? 'bg-red-600' : 'bg-blue-600'}`}
            >
              <Text className="text-white font-semibold">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
