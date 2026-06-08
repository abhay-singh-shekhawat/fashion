import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppDispatch, RootState } from '../../store/store';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchProfile } from '../../store/slices/userSlice';
import Button from '../../components/common/Button';

type ProfileScreenProps = NativeStackScreenProps<any, 'Profile'>;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, loading } = useSelector((state: RootState) => state.user);
  const { itemCount } = useSelector((state: RootState) => state.wardrobe);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      await dispatch(fetchProfile()).unwrap();
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

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
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full items-center justify-center">
              <Text className="text-4xl">👤</Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {user?.name || 'User'}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Profile Info */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Profile Information
            </Text>

            {profile ? (
              <>
                <View className="flex-row justify-between py-3 border-b border-gray-200">
                  <Text className="text-gray-600">Height</Text>
                  <Text className="font-semibold text-gray-800">
                    {profile.heightCm} cm
                  </Text>
                </View>
                <View className="flex-row justify-between py-3 border-b border-gray-200">
                  <Text className="text-gray-600">Weight</Text>
                  <Text className="font-semibold text-gray-800">
                    {profile.weightKg} kg
                  </Text>
                </View>
                <View className="flex-row justify-between py-3 border-b border-gray-200">
                  <Text className="text-gray-600">Age</Text>
                  <Text className="font-semibold text-gray-800">
                    {profile.age} years
                  </Text>
                </View>
                <View className="flex-row justify-between py-3 border-b border-gray-200">
                  <Text className="text-gray-600">Gender</Text>
                  <Text className="font-semibold text-gray-800 capitalize">
                    {profile.gender.replace(/_/g, ' ')}
                  </Text>
                </View>
                <View className="flex-row justify-between py-3">
                  <Text className="text-gray-600">Skin Tone</Text>
                  <Text className="font-semibold text-gray-800 capitalize">
                    {profile.skinTone}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-blue-100 mt-3 py-2 px-4 rounded"
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Text className="text-blue-600 font-semibold text-center">
                    Settings
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="text-gray-600 mb-4">
                  Complete your profile to get better recommendations
                </Text>
                <Button
                  title="Setup Profile"
                  onPress={() => navigation.navigate('ProfileSetup')}
                />
              </>
            )}
          </View>

          {/* Stats */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Stats
            </Text>

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1 bg-blue-50 rounded-lg p-4">
                <Text className="text-2xl font-bold text-blue-600">
                  {itemCount}
                </Text>
                <Text className="text-sm text-gray-600 mt-1">Wardrobe Items</Text>
              </View>

              <View className="flex-1 bg-green-50 rounded-lg p-4">
                <Text className="text-2xl font-bold text-green-600">0</Text>
                <Text className="text-sm text-gray-600 mt-1">Scans</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-purple-50 rounded-lg p-4">
                <Text className="text-2xl font-bold text-purple-600">0</Text>
                <Text className="text-sm text-gray-600 mt-1">Points</Text>
              </View>

              <View className="flex-1 bg-orange-50 rounded-lg p-4">
                <Text className="text-2xl font-bold text-orange-600">1</Text>
                <Text className="text-sm text-gray-600 mt-1">Level</Text>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
            <TouchableOpacity className="px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-gray-800 font-semibold">Notifications</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="px-6 py-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-gray-800 font-semibold">Privacy</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity className="px-6 py-4 flex-row justify-between items-center">
              <Text className="text-gray-800 font-semibold">Help & Support</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            className="bg-red-50 border border-red-200 rounded-lg py-4 px-6 items-center"
            onPress={handleLogout}
          >
            <Text className="text-red-600 font-semibold text-lg">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;