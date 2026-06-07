import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { loginSchema, LoginFormData } from '../../utils/authValidation';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  onRegisterPress?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading = false,
  error: externalError,
  onRegisterPress,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
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
          <Text className="text-3xl font-bold mb-2">Welcome Back</Text>
          <Text className="text-gray-600 mb-8">Login to your account</Text>

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
              <Input
                label="Password"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
                placeholderTextColor="#999"
              />
            )}
          />

          {/* Remember Me */}
          <Controller
            control={control}
            name="rememberMe"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                className="flex-row items-center my-4"
                onPress={() => onChange(!value)}
              >
                <View
                  className={`w-5 h-5 border-2 rounded mr-3 ${
                    value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                />
                <Text className="text-sm text-gray-700">Remember me</Text>
              </TouchableOpacity>
            )}
          />

          {/* Display error from external source */}
          {externalError && (
            <Text className="text-red-500 mb-4 text-center">{externalError}</Text>
          )}

          <Button title="Login" onPress={handleSubmit(handleFormSubmit)} loading={loading} />

          <TouchableOpacity onPress={onRegisterPress} className="mt-4">
            <Text className="text-center text-gray-600">
              Don't have an account? <Text className="font-bold text-blue-600">Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toastMessage && <Toast message={toastMessage} type="error" />}
    </KeyboardAvoidingView>
  );
};

export default LoginForm;