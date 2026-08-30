import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { apiClient } from '../../lib/api/client';
import { setTokens } from '../../lib/auth/token-storage';
import { useAuthStore } from '../../stores/auth-store';
import { useTranslation } from '../../lib/i18n';

export default function LoginScreen() {
  const { t } = useTranslation();
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
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        deviceInfo: 'React Native Mobile App',
      });

      if (response.data?.success) {
        const { user, tokens } = response.data.data;
        await setTokens(tokens.accessToken, tokens.refreshToken);
        login(user);
      } else {
        Alert.alert('Login Failed', response.data?.error || 'Unknown error');
      }
    } catch (error: any) {
      console.log('Login error:', error);
      let msg = 'Network error. Please check your connection and API URL.';
      
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        msg = typeof apiError === 'string' ? apiError : (apiError.message || JSON.stringify(apiError));
      } else if (error.message) {
        msg = error.message;
      }
      
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6 bg-slate-50"
      >
        <View className="mb-10 items-center">
          <Text className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">{t('login')}</Text>
          <Text className="text-slate-500 text-center">{t('loginPrompt')}</Text>
        </View>
        
        <View className="mb-5">
          <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">{t('email')}</Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-4 bg-white text-slate-900 shadow-sm"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Masukkan email Anda"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View className="mb-8">
          <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">{t('password')}</Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-4 bg-white text-slate-900 shadow-sm"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Masukkan kata sandi"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center mb-6 shadow-md shadow-blue-500/30"
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg tracking-wide">{t('login')}</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center items-center">
          <Text className="text-slate-600 mr-2">{t('dontHaveAccount')}</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-bold">{t('register')}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
