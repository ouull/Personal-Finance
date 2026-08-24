import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { apiClient } from '../../lib/api/client';
import { setTokens } from '../../lib/auth/token-storage';
import { useAuthStore } from '../../stores/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      // Need a device info, fallback to 'mobile'
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceInfo: 'React Native Mobile App',
      });

      if (response.data?.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await setTokens(accessToken, refreshToken);
        login(user);
      } else {
        Alert.alert('Login Failed', response.data?.error || 'Unknown error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Network error';
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Masuk</Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1">Email</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-8">
        <Text className="text-sm font-medium mb-1">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 items-center mb-4"
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Masuk</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-gray-600">Belum punya akun? </Text>
        <Link href="/(auth)/register" className="text-blue-600 font-medium">
          Daftar
        </Link>
      </View>
    </View>
  );
}
