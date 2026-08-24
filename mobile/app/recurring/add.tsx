import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddRecurringScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('EXPENSE');

  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [isFreqSheetOpen, setIsFreqSheetOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories(type),
    queryFn: async () => {
      const res = await apiClient.get(`/categories?type=${type}`);
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.status === 'ACTIVE') || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);
  const categories = categoriesData?.data || [];
  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/recurring', {
        name,
        amount: parseFloat(amount),
        type,
        frequency,
        accountId,
        categoryId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!name.trim() || !amount || !accountId || !categoryId) {
      Alert.alert(t('errorOccurred'), 'Semua field wajib diisi.');
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
        <Text className="text-xl font-bold text-gray-900">{t('addRecurring')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label="Nama / Keterangan"
            placeholder="Misal: Tagihan Listrik"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('type')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsTypeSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{type === 'EXPENSE' ? t('expense') : t('income')}</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('frequency')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsFreqSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{frequency}</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('account')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('category')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsCategorySheetOpen(true)}
            >
              <Text className={selectedCategory ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedCategory ? selectedCategory.displayName || selectedCategory.name : 'Pilih Kategori'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !amount || !accountId || !categoryId} 
            />
          </View>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isTypeSheetOpen} onClose={() => setIsTypeSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectType')}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('EXPENSE'); setCategoryId(''); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('expense')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('INCOME'); setCategoryId(''); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('income')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={isFreqSheetOpen} onClose={() => setIsFreqSheetOpen(false)} height={320}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectFrequency')}</Text>
          {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((freq) => (
            <TouchableOpacity 
              key={freq}
              className="py-4 border-b border-gray-100"
              onPress={() => { setFrequency(freq); setIsFreqSheetOpen(false); }}
            >
              <Text className="text-base text-gray-900">{freq}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={isAccountSheetOpen} onClose={() => setIsAccountSheetOpen(false)}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {accounts.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                className="py-4 border-b border-gray-100"
                onPress={() => {
                  setAccountId(a.id);
                  setIsAccountSheetOpen(false);
                }}
              >
                <Text className="text-base">{a.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
      
      <BottomSheet visible={isCategorySheetOpen} onClose={() => setIsCategorySheetOpen(false)}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectCategory')}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {categories.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                className="py-4 border-b border-gray-100"
                onPress={() => {
                  setCategoryId(c.id);
                  setIsCategorySheetOpen(false);
                }}
              >
                <Text className="text-base">{c.displayName || c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
