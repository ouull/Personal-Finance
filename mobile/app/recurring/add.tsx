import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, ChevronDown } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { DatePickerInput } from '../../components/ui/date-picker-input';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddRecurringScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('SUBSCRIPTION');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [accountId, setAccountId] = useState('');
  const [nextDueDate, setNextDueDate] = useState<Date | null>(new Date());
  const [notify, setNotify] = useState(false);

  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [isFreqSheetOpen, setIsFreqSheetOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories('EXPENSE'),
    queryFn: async () => {
      const res = await apiClient.get(`/categories?type=EXPENSE`);
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.isActive === true) || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);
  const categories = categoriesData?.data || [];

  const getAutoCategoryId = () => {
    let cat;
    if (type === 'SUBSCRIPTION') {
      cat = categories.find((c: any) => c.slug === 'subscription' || c.name.toLowerCase().includes('langganan'));
    } else if (type === 'BILL') {
      cat = categories.find((c: any) => c.slug === 'bill' || c.name.toLowerCase().includes('tagihan'));
    } else {
      cat = categories.find((c: any) => c.slug === 'recurring_expense' || c.name.toLowerCase().includes('rutin'));
    }
    return cat?.id || categories[0]?.id;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/recurring', {
        name,
        amount: parseFloat(amount),
        type,
        billingCycle,
        accountId,
        categoryId: getAutoCategoryId(),
        nextDueDate: nextDueDate ? nextDueDate.toISOString() : new Date().toISOString(),
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
    if (!name.trim() || !amount || !accountId) {
      Alert.alert(t('errorOccurred'), 'Semua field wajib diisi.');
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
        <Text className="text-xl font-bold text-gray-900">{t('addRoutine')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label="Service Name"
            placeholder="e.g. Spotify, Netflix"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label="Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
            leftIcon={<Text className="font-bold text-gray-400 text-base">Rp.</Text>}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('routineType')}</Text>
            <TouchableOpacity 
              className="border border-theme-border rounded-xl px-4 py-3 bg-white flex-row justify-between items-center"
              onPress={() => setIsTypeSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{type === 'SUBSCRIPTION' ? t('subscriptionType') : type === 'BILL' ? t('billType') : t('routineExpenseType')}</Text>
              <ChevronDown size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('selectAccount')}</Text>
            <TouchableOpacity 
              className="border border-theme-border rounded-xl px-4 py-3 bg-white flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccountPlaceholder')}
              </Text>
              <ChevronDown size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('billingCycle')}</Text>
            <View className="flex-row bg-theme-input p-1 rounded-xl">
              <TouchableOpacity 
                className={`flex-1 items-center justify-center py-3 rounded-lg ${billingCycle === 'MONTHLY' ? 'bg-black' : ''}`}
                onPress={() => setBillingCycle('MONTHLY')}
              >
                <Text className={`font-medium ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-gray-600'}`}>{t('monthly')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`flex-1 items-center justify-center py-3 rounded-lg ${billingCycle === 'YEARLY' ? 'bg-black' : ''}`}
                onPress={() => setBillingCycle('YEARLY')}
              >
                <Text className={`font-medium ${billingCycle === 'YEARLY' ? 'text-white' : 'text-gray-600'}`}>{t('yearly')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <DatePickerInput 
            label={t("dueDate")}
            value={nextDueDate}
            minimumDate={new Date()}
            onChange={setNextDueDate as any}
          />

          <View className="mt-4 pt-4 border-t border-theme-border flex-row justify-between items-center mb-8">
            <View>
              <Text className="font-bold text-gray-900 mb-1">{t('notifyBeforePayment')}</Text>
              <Text className="text-xs text-gray-500">Get an alert 2 days before charge</Text>
            </View>
            <Switch value={notify} onValueChange={setNotify} trackColor={{ false: '#e5e7eb', true: '#000000' }} />
          </View>

          <View className="mt-4">
            <Button 
              label="Add Subscription" 
              icon={<Plus color="#ffffff" size={20} />}
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !amount || !accountId} 
            />
          </View>
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isTypeSheetOpen} onClose={() => setIsTypeSheetOpen(false)} height={260}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectType')}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('SUBSCRIPTION'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('subscription')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('BILL'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('bill')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100"
            onPress={() => { setType('RECURRING_EXPENSE'); setIsTypeSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('routineExpense')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet visible={isFreqSheetOpen} onClose={() => setIsFreqSheetOpen(false)} height={320}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectFrequency')}</Text>
          {['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((freq) => (
            <TouchableOpacity 
              key={freq}
              className="py-4 border-b border-gray-100"
              onPress={() => { setBillingCycle(freq); setIsFreqSheetOpen(false); }}
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
    </View>
  );
}
