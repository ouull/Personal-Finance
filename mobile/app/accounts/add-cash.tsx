import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddCashScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Format number with dots
  const formatNumber = (numStr: string) => {
    const cleanNum = numStr.replace(/\D/g, '');
    if (!cleanNum) return '';
    return parseInt(cleanNum, 10).toLocaleString('id-ID');
  };

  const handleAmountChange = (text: string) => {
    setAmount(formatNumber(text));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const rawAmount = amount ? parseFloat(amount.replace(/\./g, '')) : 0;
      return apiClient.post('/transactions', {
        amount: rawAmount,
        destinationAccountId: id,
        type: 'INCOME',
        notes: notes.trim() || undefined,
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions({}) });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!amount) {
      Alert.alert(t('errorOccurred'), 'Nominal harus diisi.');
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
        <Text className="text-xl font-bold text-gray-900">{t('addCashBalance')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          
          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={handleAmountChange}
            autoFocus
          />
          
          <Input 
            label="Keterangan (Opsional)"
            placeholder="Misal: Uang jajan, Hasil jualan..."
            value={notes}
            onChangeText={setNotes}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!amount} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
