import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';
import { Button } from '../../components/ui/button';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';
import { Badge } from '../../components/ui/badge';

export default function LendingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.loan(id as string),
    queryFn: async () => {
      const response = await apiClient.get(`/lending/${id}`);
      return response.data;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.status === 'ACTIVE') || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const repaymentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/lending/${id}/repayments`, {
        amount: parseFloat(repaymentAmount),
        accountId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loan(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lending });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      setIsRepaymentOpen(false);
      setRepaymentAmount('');
      setAccountId('');
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  if (isLoading) {
    return (
      <Screen className="justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </Screen>
    );
  }

  if (isError || !data?.data) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const loan = data.data;

  const handleOpenRepayment = () => {
    setIsRepaymentOpen(true);
  };

  const handleSaveRepayment = () => {
    if (!repaymentAmount || !accountId) {
      Alert.alert(t('errorOccurred'), 'Semua field wajib diisi.');
      return;
    }
    repaymentMutation.mutate();
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row items-center px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{loan.name}</Text>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="mb-6 bg-white border-0 shadow-sm items-center py-6">
          <Badge label={loan.status} variant={loan.status === 'PAID' ? 'success' : 'warning'} className="mb-2" />
          <Text className="text-gray-500 font-medium mb-1">{t('outstanding')}</Text>
          <AmountText amount={loan.outstandingAmount} className="text-gray-900 text-4xl font-bold mb-6" showSign={false} />
          
          <View className="flex-row w-full justify-around border-t border-gray-100 pt-4">
            <View className="items-center">
              <Text className="text-gray-500 text-xs mb-1">Total {loan.type === 'LOAN_GIVEN' ? t('loanGiven') : t('loanTaken')}</Text>
              <AmountText amount={loan.amount} className="text-gray-900 font-semibold" showSign={false} />
            </View>
          </View>
        </Card>

        {loan.status !== 'PAID' && (
          <Button 
            label={t('repayment')} 
            className="mb-8" 
            onPress={handleOpenRepayment} 
          />
        )}

        <SectionHeader title={t('repayment')} />
        <Card className="mb-8 p-0">
          {loan.repayments?.length > 0 ? (
            loan.repayments.map((rp: any, index: number) => (
              <View key={rp.id} className={`flex-row justify-between items-center p-4 ${index !== loan.repayments.length -1 ? 'border-b border-gray-100' : ''}`}>
                <View>
                  <Text className="font-semibold text-gray-900">{new Date(rp.date).toLocaleDateString()}</Text>
                </View>
                <AmountText amount={rp.amount} className="font-bold" showSign={false} />
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic p-4">{t('noRepaymentHistory')}</Text>
          )}
        </Card>
        
        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isRepaymentOpen} onClose={() => setIsRepaymentOpen(false)} height={420}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 p-6">
          <Text className="text-xl font-bold mb-4">{t('repayment')}</Text>
          
          <Input 
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={repaymentAmount}
            onChangeText={setRepaymentAmount}
            autoFocus
          />

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

          <View className="mt-4 flex-row gap-4">
            <Button label={t('cancel')} variant="secondary" className="flex-1" onPress={() => setIsRepaymentOpen(false)} />
            <Button label={t('save')} className="flex-1" onPress={handleSaveRepayment} isLoading={repaymentMutation.isPending} disabled={!repaymentAmount || !accountId} />
          </View>
        </KeyboardAvoidingView>
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
    </Screen>
  );
}
