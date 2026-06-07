import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { registerSchema, RegisterFormData } from '../../utils/authValidation';

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onNavigateLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error: externalError,
  onNavigateLogin,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  const password = watch('password');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleFormSubmit = async (data: RegisterFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Registration failed';
      setToastMessage(message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-white px-6 py-8"
      >
        <View className="flex-1 justify-center">
          <Text className="text-3xl font-bold mb-2">Create Account</Text>
          <Text className="text-gray-600 mb-8">Join us today</Text>

          {/* Name Input */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Email Input */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Email"
                placeholder="john@example.com"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Password Input */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <>
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  error={errors.password?.message}
                  placeholderTextColor="#999"
                />
              </>
            )}
          />

          {/* Confirm Password Input */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.confirmPassword?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Terms & Conditions */}
          <Controller
            control={control}
            name="termsAccepted"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  className="flex-row items-center my-4"
                  onPress={() => onChange(!value)}
                >
                  <View
                    className={`w-5 h-5 border-2 rounded mr-3 ${
                      value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}
                  />
                  <Text className="text-sm text-gray-700">
                    I agree to Terms & Conditions
                  </Text>
                </TouchableOpacity>
                {errors.termsAccepted && (
                  <Text className="text-red-500 text-xs mb-4">
                    {errors.termsAccepted.message}
                  </Text>
                )}
              </>
            )}
          />

          {/* Display error from external source */}
          {externalError && (
            <Text className="text-red-500 text-sm mb-4 text-center">
              {externalError}
            </Text>
          )}

          {/* Register Button */}
          <Button
            title="Create Account"
            onPress={handleSubmit(handleFormSubmit)}
            loading={loading}
            disabled={loading}
            className="mt-8 mb-4"
          />

          {/* Login Link */}
          <TouchableOpacity
            onPress={onNavigateLogin}
            disabled={loading}
            className="py-4"
          >
            <Text className="text-center text-blue-500 font-semibold">
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Message */}
      {externalError && <Toast message={externalError} type="error" />}
    </KeyboardAvoidingView>
  );
};

export default RegisterForm;