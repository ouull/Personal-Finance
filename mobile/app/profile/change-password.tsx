import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';
import { useAuthStore } from '../../stores/auth-store';

export default function ChangePasswordScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/profile/change-password', {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: async () => {
      Alert.alert(
        'Sukses',
        'Password berhasil diubah. Silakan masuk kembali dengan password baru.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              queryClient.clear();
              router.replace('/(auth)/login');
            }
          }
        ]
      );
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('errorOccurred'), 'Semua field wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('errorOccurred'), 'Konfirmasi password tidak cocok.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('changePassword')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label="Password Saat Ini"
            placeholder="Masukkan password saat ini"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoFocus
          />

          <Input 
            label="Password Baru"
            placeholder="Masukkan password baru"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Input 
            label="Konfirmasi Password Baru"
            placeholder="Ketik ulang password baru"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!currentPassword || !newPassword || !confirmPassword} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
