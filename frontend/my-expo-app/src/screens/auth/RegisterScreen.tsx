import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, loading, error } = useAuth();

  const handleRegister = async (data: any) => {
    try {
      await register(data);
      // Navigation handled by Redux state
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <AuthHeader />
      <RegisterForm
        onSubmit={handleRegister}
        loading={loading}
        error={error}
        onNavigateLogin={() => navigation.navigate('Login')}
      />
    </SafeAreaView>
  );
};

export default RegisterScreen;