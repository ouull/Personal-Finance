import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      const accounts = response.data?.data || [];
      return accounts.find((a: any) => a.id === id);
    },
  });

  useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(data.name);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/accounts/${id}`, {
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('errorOccurred'), 'Nama akun harus diisi.');
      return;
    }
    mutation.mutate();
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-16">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('edit')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Input 
            label={t('accountName')}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('accountType')}</Text>
            <View className="border border-gray-200 rounded-xl p-4 bg-gray-100">
              <Text className="text-gray-500 text-base">{data.type === 'BANK' ? t('bank') : t('eWallet')}</Text>
            </View>
            <Text className="text-xs text-gray-500 mt-1">{t('accountTypeCannotBeEdited')}</Text>
          </View>

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || name === data.name} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
