import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { apiClient } from '../../lib/api/client';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name,
        language: 'id',
      });

      if (response.data?.success) {
        Alert.alert('Success', 'Registration successful', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      } else {
        Alert.alert('Registration Failed', response.data?.error || 'Unknown error');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Network error';
      Alert.alert('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Daftar</Text>
      
      <View className="mb-4">
        <Text className="text-sm font-medium mb-1">Nama Lengkap</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
          value={name}
          onChangeText={setName}
        />
      </View>

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
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Daftar</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-gray-600">Sudah punya akun? </Text>
        <Link href="/(auth)/login" className="text-blue-600 font-medium">
          Masuk
        </Link>
      </View>
    </View>
  );
}
