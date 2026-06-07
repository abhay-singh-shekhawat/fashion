import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loading, error } = useAuth();

  const handleLogin = async (data: any) => {
    try {
      await login(data);
      // Navigation handled by Redux state
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <AuthHeader />
      <LoginForm
        onSubmit={handleLogin}
        loading={loading}
        error={error}
        onRegisterPress={() => navigation.navigate('Register')}
      />
    </SafeAreaView>
  );
};

export default LoginScreen;