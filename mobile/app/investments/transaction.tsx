import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function InvestmentTransactionScreen() {
  const { id, type } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.status === 'ACTIVE') || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/investments/${id}/transactions`, {
        type,
        amount: parseFloat(amount),
        accountId: accountId || undefined,
        shares: shares ? parseFloat(shares) : undefined,
        price: price ? parseFloat(price) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investment(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (accountId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      }
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

  const getTitle = () => {
    switch (type) {
      case 'BUY': return t('buy');
      case 'SELL': return t('sell');
      case 'DEPOSIT': return t('deposit');
      case 'WITHDRAW': return t('withdraw');
      default: return 'Transaksi Investasi';
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{getTitle()}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          
          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          {(type === 'BUY' || type === 'SELL') && (
            <>
              <Input 
                label="Jumlah Unit/Lembar (Opsional)"
                placeholder="0"
                keyboardType="numeric"
                value={shares}
                onChangeText={setShares}
              />
              <Input 
                label="Harga Per Unit (Opsional)"
                placeholder="0"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </>
          )}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Akun Sumber / Tujuan (Opsional)</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Text>
            </TouchableOpacity>
          </View>

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

      <BottomSheet visible={isAccountSheetOpen} onClose={() => setIsAccountSheetOpen(false)}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <TouchableOpacity
              className="py-4 border-b border-gray-100"
              onPress={() => {
                setAccountId('');
                setIsAccountSheetOpen(false);
              }}
            >
              <Text className="text-base text-gray-500">Tidak ada</Text>
            </TouchableOpacity>
            {accounts.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                className="py-4 border-b border-gray-100"
                onPress={() => {
                  setAccountId(a.id);
                  setIsAccountSheetOpen(false);
                }}
              >
                <Text className="text-base text-gray-900">{a.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
