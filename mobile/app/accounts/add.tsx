import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddAccountScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [initialBalance, setInitialBalance] = useState('');
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);

  // Format number with dots
  const formatNumber = (numStr: string) => {
    const cleanNum = numStr.replace(/\D/g, '');
    if (!cleanNum) return '';
    return parseInt(cleanNum, 10).toLocaleString('id-ID');
  };

  const handleBalanceChange = (text: string) => {
    setInitialBalance(formatNumber(text));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const rawBalance = initialBalance ? parseFloat(initialBalance.replace(/\./g, '')) : 0;
      return apiClient.post('/accounts', {
        name,
        type,
        balance: rawBalance,
        currency: 'IDR'
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

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-16">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('addAccount')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label={t('accountName')}
            placeholder="Misal: BCA, GoPay"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('accountType')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsTypeSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{type === 'BANK' ? t('bank') : t('eWallet')}</Text>
            </TouchableOpacity>
          </View>

          <Input 
            label={t('openingBalance')}
            placeholder="0"
            keyboardType="numeric"
            value={initialBalance}
            onChangeText={handleBalanceChange}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim()} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isTypeSheetOpen} onClose={() => setIsTypeSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('accountType')}</Text>
          <TouchableOpacity 
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            onPress={() => { setType('BANK'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('bank')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
            onPress={() => { setType('EWALLET'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('eWallet')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}
