import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Toast } from '../../components/common/Toast';
import { profileSchema, ProfileFormData } from '../../utils/authValidation';
import { profileAPI } from '../../services/api/profileAPI';

type ProfileSetupScreenProps = NativeStackScreenProps<any, 'ProfileSetup'>;

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  navigation,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onBlur',
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);

      const profile = await profileAPI.updateProfile({
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        age: data.age,
        gender: data.gender,
        skinTone: data.skinTone,
      });

      setToastType('success');
      setToastMessage('Profile updated successfully!');

      // Navigate to main app after brief delay
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 1500);
    } catch (error) {
      setToastType('error');
      const message =
        error instanceof Error ? error.message : 'Failed to update profile';
      setToastMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          className="flex-1 bg-white px-6 py-8"
        >
          <Text className="text-3xl font-bold mb-2">Complete Your Profile</Text>
          <Text className="text-gray-600 mb-8">
            Help us understand your style better
          </Text>

          {/* Height Input */}
          <Controller
            control={control}
            name="heightCm"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Height (cm)"
                placeholder="175"
                value={value?.toString()}
                onChangeText={(text: string) => onChange(parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                error={errors.heightCm?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Weight Input */}
          <Controller
            control={control}
            name="weightKg"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Weight (kg)"
                placeholder="70"
                value={value?.toString()}
                onChangeText={(text: string) => onChange(parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                error={errors.weightKg?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Age Input */}
          <Controller
            control={control}
            name="age"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Age"
                placeholder="28"
                value={value?.toString()}
                onChangeText={(text: string) => onChange(parseInt(text) || 0)}
                keyboardType="number-pad"
                error={errors.age?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Gender Selection */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Gender</Text>
            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <View>
                  {['male', 'female', 'other', 'prefer_not_to_say'].map(
                    (option) => (
                      <TouchableOpacity
                        key={option}
                        className="flex-row items-center py-2 border-b border-gray-200"
                        onPress={() => onChange(option as any)}
                      >
                        <View
                          className={`w-5 h-5 rounded-full border-2 mr-3 ${
                            value === option
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        />
                        <Text className="text-gray-700 capitalize">
                          {option.replace(/_/g, ' ')}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            />
            {errors.gender && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.gender.message}
              </Text>
            )}
          </View>

          {/* Skin Tone Selection */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-3">Skin Tone</Text>
            <Controller
              control={control}
              name="skinTone"
              render={({ field: { onChange, value } }) => (
                <View>
                  {[
                    { key: 'warm', label: 'Warm (Golden, olive undertone)' },
                    { key: 'cool', label: 'Cool (Pink, red undertone)' },
                    { key: 'neutral', label: 'Neutral (Balanced)' },
                    { key: 'olive', label: 'Olive (Green undertone)' },
                    { key: 'unknown', label: 'Not sure' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      className="flex-row items-center py-2 border-b border-gray-200"
                      onPress={() => onChange(option.key as any)}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 mr-3 ${
                          value === option.key
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      />
                      <Text className="text-gray-700">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.skinTone && (
              <Text className="text-red-500 text-xs mt-2">
                {errors.skinTone.message}
              </Text>
            )}
          </View>

          {/* Save Button */}
          <Button
            title="Complete Profile"
            onPress={handleSubmit(handleProfileSubmit)}
            loading={loading}
            disabled={loading}
            className="mt-8 mb-4"
          />

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            disabled={loading}
            className="py-4"
          >
            <Text className="text-center text-blue-500 font-semibold">
              Skip for now
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </SafeAreaView>
  );
};

export default ProfileSetupScreen;