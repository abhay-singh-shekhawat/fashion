import React from 'react';
import {
  View,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch } from '../../store/store';
import { logoutUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';

type SettingsScreenProps = NativeStackScreenProps<any, 'Settings'>;

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [offlineModeEnabled, setOfflineModeEnabled] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUser());
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will clear all cached data. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            console.log('Data cleared');
          },
        },
      ]
    );
  };

  const SettingsSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-lg font-bold text-gray-800 px-6 mb-3">
        {title}
      </Text>
      <View className="bg-white rounded-lg overflow-hidden shadow-sm">
        {children}
      </View>
    </View>
  );

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      className="px-6 py-4 border-b border-gray-100 flex-row justify-between items-center"
      onPress={onPress}
    >
      <View className="flex-row items-center flex-1">
        <Text className="text-2xl mr-4">{icon}</Text>
        <View className="flex-1">
          <Text className="text-gray-800 font-semibold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-600 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || <Text className="text-gray-400">›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">Settings</Text>
        </View>

        <View className="pt-6">
          {/* Notifications Settings */}
          <SettingsSection title="Notifications">
            <SettingsItem
              icon="🔔"
              title="Enable Notifications"
              subtitle="Receive updates and reminders"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              }
            />
          </SettingsSection>

          {/* Display Settings */}
          <SettingsSection title="Display">
            <SettingsItem
              icon="🌙"
              title="Dark Mode"
              subtitle="Easy on the eyes"
              rightElement={
                <Switch
                  value={darkModeEnabled}
                  onValueChange={setDarkModeEnabled}
                />
              }
            />
            <SettingsItem
              icon="🖼️"
              title="App Theme"
              subtitle="Customize colors"
              onPress={() => console.log('Theme settings')}
            />
          </SettingsSection>

          {/* Data Settings */}
          <SettingsSection title="Data & Privacy">
            <SettingsItem
              icon="📡"
              title="Offline Mode"
              subtitle="Use app without internet"
              rightElement={
                <Switch
                  value={offlineModeEnabled}
                  onValueChange={setOfflineModeEnabled}
                />
              }
            />
            <SettingsItem
              icon="🔒"
              title="Privacy Policy"
              onPress={() => console.log('Privacy policy')}
            />
            <SettingsItem
              icon="📋"
              title="Terms of Service"
              onPress={() => console.log('Terms of service')}
            />
            <SettingsItem
              icon="🗑️"
              title="Clear Cache"
              onPress={handleClearData}
            />
          </SettingsSection>

          {/* Account Settings */}
          <SettingsSection title="Account">
            <SettingsItem
              icon="👤"
              title="Edit Profile"
              onPress={() => navigation.navigate('ProfileSetup')}
            />
            <SettingsItem
              icon="🔐"
              title="Change Password"
              onPress={() => console.log('Change password')}
            />
            <SettingsItem
              icon="🛡️"
              title="Account Security"
              onPress={() => console.log('Security settings')}
            />
          </SettingsSection>

          {/* Support Settings */}
          <SettingsSection title="Support & About">
            <SettingsItem
              icon="❓"
              title="Help & Support"
              onPress={() => console.log('Help')}
            />
            <SettingsItem
              icon="⭐"
              title="Rate App"
              onPress={() => console.log('Rate app')}
            />
            <SettingsItem
              icon="📧"
              title="Send Feedback"
              onPress={() => console.log('Feedback')}
            />
            <SettingsItem
              icon="ℹ️"
              title="About App"
              subtitle="Version 1.0.0"
            />
          </SettingsSection>

          {/* Logout Button */}
          <View className="px-6 mt-8 mb-8">
            <Button
              title="Logout"
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;