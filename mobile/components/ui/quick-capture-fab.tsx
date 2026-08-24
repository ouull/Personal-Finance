import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from '../../lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { BottomSheet } from './bottom-sheet';
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
  const accounts = accountsData?.data?.filter((a: any) => a.status === 'ACTIVE') || [];
  
  const selectedCategory = categories.find((c: any) => c.id === categoryId);
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/transactions/quick-capture', {
        amount: parseFloat(amount),
        categoryId,
        accountId,
        merchantName: merchant || undefined,
        note: note || undefined,
        type: 'EXPENSE',
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
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg elevation-5"
        onPress={() => setIsOpen(true)}
      >
        <Plus color="white" size={28} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="text-xl font-bold">{t('quickCapture')}</Text>
            <TouchableOpacity onPress={() => setIsOpen(false)} className="p-2">
              <X color="#4b5563" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" keyboardShouldPersistTaps="handled">
            <View className="items-center mb-8">
              <Text className="text-gray-500 mb-2 font-medium">Rp</Text>
              <TextInput
                className="text-5xl font-bold text-center w-full"
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">{t('category')}</Text>
              
              {/* Quick shortcuts */}
              <View className="flex-row flex-wrap mb-3 gap-2">
                {categories.slice(0, 4).map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    className={`px-4 py-2 rounded-full border ${
                      categoryId === c.id ? 'bg-blue-100 border-blue-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text className={categoryId === c.id ? 'text-blue-700 font-semibold' : 'text-gray-700'}>
                      {c.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
                onPress={() => setIsCategorySheetOpen(true)}
              >
                <Text className={selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {selectedCategory ? selectedCategory.displayName : t('selectCategory')}
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
        </KeyboardAvoidingView>
      </Modal>

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
    </>
  );
}
