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

export default function AddCashScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('INCOME'); // or INITIAL_BALANCE
  const [categoryId, setCategoryId] = useState('');
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories('INCOME'),
    queryFn: async () => {
      const res = await apiClient.get('/categories?type=INCOME');
      return res.data;
    },
    enabled: type === 'INCOME',
  });

  const categories = categoriesData?.data || [];
  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/transactions', {
        amount: parseFloat(amount),
        accountId: id,
        type,
        categoryId: type === 'INCOME' ? categoryId : undefined,
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
    if (type === 'INCOME' && !categoryId) {
      Alert.alert(t('errorOccurred'), 'Pemasukan Tunai memerlukan kategori.');
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
        <Text className="text-xl font-bold text-gray-900">{t('addCashBalance')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Tipe Transaksi</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsTypeSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{type === 'INCOME' ? t('cashIncome') : t('openingBalance')}</Text>
            </TouchableOpacity>
          </View>

          {type === 'INCOME' && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">{t('category')}</Text>
              <TouchableOpacity 
                className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
                onPress={() => setIsCategorySheetOpen(true)}
              >
                <Text className={selectedCategory ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                  {selectedCategory ? selectedCategory.displayName : t('selectCategory')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!amount || (type === 'INCOME' && !categoryId)} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isTypeSheetOpen} onClose={() => setIsTypeSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">Pilih Tipe</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('INCOME'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('cashIncome')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('INITIAL_BALANCE'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('openingBalance')}</Text>
          </TouchableOpacity>
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
                <Text className="text-base">{c.displayName}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
