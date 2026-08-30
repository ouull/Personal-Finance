import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';
import { BottomSheet } from '../../components/ui/bottom-sheet';

export default function AddBudgetScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSelectingCategory, setIsSelectingCategory] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: categoryData } = useQuery({
    queryKey: queryKeys.categories('EXPENSE'),
    queryFn: async () => {
      const res = await apiClient.get('/categories?type=EXPENSE');
      return res.data;
    },
  });

  const categories = categoryData?.data?.filter((c: any) => c.isActive) || [];
  const selectedCategory = categories.find((c: any) => c.id === categoryId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/budgets', {
        categoryId,
        amount: parseFloat(amount),
        month,
        year,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets({ month, year }) });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!categoryId || !amount) {
      Alert.alert(t('errorOccurred'), 'Kategori dan Batas Anggaran wajib diisi.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-theme-bg">
      <View className="flex-row items-center p-4 border-b border-theme-border pt-16">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('createBudget')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-900 mb-2">{t('expenseCategory')}</Text>
            <TouchableOpacity 
              className="border border-theme-border rounded-xl p-4 bg-theme-input flex-row justify-between items-center"
              onPress={() => setIsSelectingCategory(true)}
            >
              <Text className={selectedCategory ? 'text-gray-900 text-base font-medium' : 'text-gray-500 text-base'}>
                {selectedCategory ? selectedCategory.name : t('selectCategory')}
              </Text>
            </TouchableOpacity>
          </View>

          <Input 
            label="Batas Anggaran (Sebulan)"
            placeholder="0"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!categoryId || !amount}
              className="rounded-full"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Bottom Sheet */}
      <BottomSheet visible={isSelectingCategory} onClose={() => setIsSelectingCategory(false)} height={400}>
        <View className="p-4 flex-1">
          <Text className="text-lg font-bold mb-4">{t('selectCategory')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                className="py-4 border-b border-theme-border flex-row items-center"
                onPress={() => {
                  setCategoryId(c.id);
                  setIsSelectingCategory(false);
                }}
              >
                <Text className="text-base text-gray-900">{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
