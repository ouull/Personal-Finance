import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from '../../lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { Input } from './input';
import { BottomSheet } from './bottom-sheet';
import { CategoryPickerSheet } from './category-picker-sheet';
import { Button } from './button';
import { getLocalizedError } from '../../lib/api/errors';

export function QuickCaptureFAB({ visible }: { visible: boolean }) {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories('EXPENSE'),
    queryFn: async () => {
      const res = await apiClient.get('/categories?type=EXPENSE');
      return res.data;
    },
    enabled: isOpen,
  });

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
    enabled: isOpen,
  });

  const categories = categoriesData?.data || [];
  const accounts = accountsData?.data?.filter((a: any) => a.isActive === true) || [];
  
  const selectedCategory = categories.find((c: any) => c.id === categoryId);
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/transactions', {
        amount: parseFloat(amount),
        categoryId,
        sourceAccountId: accountId,
        description: merchant || undefined,
        notes: note || undefined,
        type: 'EXPENSE',
        date: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      setIsOpen(false);
      setAmount('');
      setNote('');
      setMerchant('');
      setCategoryId('');
      setAccountId('');
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    },
  });

  const handleSave = () => {
    if (!amount || !categoryId || !accountId) {
      Alert.alert(t('errorOccurred'), 'Mohon isi nominal, kategori, dan akun.');
      return;
    }
    mutation.mutate();
  };

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        className="absolute bottom-24 right-6 bg-black w-16 h-16 rounded-full items-center justify-center shadow-lg elevation-5"
        onPress={() => setIsOpen(true)}
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'white' }}>
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="text-xl font-bold">{t('quickCapture')}</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)} className="p-2">
              <X color="#4b5563" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
            <View className="items-center mb-8">
              <Text className="text-gray-500 mb-2 font-medium">Rp</Text>
              <TextInput
                className="text-5xl font-bold text-center w-full"
                placeholder="0"
                keyboardType="numeric"
                value={amount ? amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
                onChangeText={(text) => {
                  const numericOnly = text.replace(/[^0-9]/g, '');
                  const formatted = numericOnly.replace(/^0+(?=\d)/, '');
                  setAmount(formatted);
                }}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('category')}</Text>
              
              <TouchableOpacity
                className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
                onPress={() => setIsCategorySheetOpen(true)}
              >
                <Text className={selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {selectedCategory ? selectedCategory.name : t('selectCategory')}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('account')}</Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
                onPress={() => setIsAccountSheetOpen(true)}
              >
                <Text className={selectedAccount ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {selectedAccount ? selectedAccount.name : t('selectAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('optionalMerchant')}</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-4 bg-gray-50"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>

            <View className="mb-8">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('optionalNote')}</Text>
              <TextInput
                className="border border-gray-300 rounded-xl p-4 bg-gray-50"
                value={note}
                onChangeText={setNote}
              />
            </View>
            
            <Button
              label={t('saveExpense')}
              onPress={handleSave}
              isLoading={mutation.isPending}
              disabled={!amount || !categoryId || !accountId}
            />
            <View className="h-10" />
          </ScrollView>

          <CategoryPickerSheet
            visible={isCategorySheetOpen}
            onClose={() => setIsCategorySheetOpen(false)}
            categories={categories}
            onSelect={(id) => setCategoryId(id)}
          />

          <BottomSheet visible={isAccountSheetOpen} onClose={() => setIsAccountSheetOpen(false)}>
            <View className="p-4">
              <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
              <ScrollView style={{ maxHeight: 400 }}>
                {accounts.map((a: any) => (
                  <TouchableOpacity
                    key={a.id}
                    className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                    onPress={() => {
                      setAccountId(a.id);
                      setIsAccountSheetOpen(false);
                    }}
                  >
                    <Text className="text-base text-gray-900">{a.name}</Text>
                    <Text className="text-sm font-medium text-gray-500">Rp {Number(a.balance || 0).toLocaleString('id-ID')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </BottomSheet>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
