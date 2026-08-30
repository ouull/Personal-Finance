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
import { DatePickerInput } from '../../components/ui/date-picker-input';

export default function LendingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isRepaymentOpen, setIsRepaymentOpen] = useState(false);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paidDate, setPaidDate] = useState<Date | null>(new Date());
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);

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

  const accounts = accountsData?.data?.filter((a: any) => a.isActive === true) || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const repaymentMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/lending/${id}/repayments`, {
        loanId: id,
        amount: parseFloat(repaymentAmount),
        accountId,
        paidDate: paidDate ? paidDate.toISOString() : new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loan(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lending });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setIsRepaymentOpen(false);
      setRepaymentAmount('');
      setAccountId('');
      setPaidDate(new Date());
      setIsSelectingAccount(false);
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
      <View className="flex-row items-center px-4 pt-16 pb-4 bg-theme-bg border-b border-theme-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{loan.borrowerName}</Text>
      </View>

      <ScrollView
        className="flex-1 bg-theme-bg px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="mb-6 bg-theme-card border border-theme-border shadow-none items-center py-8 rounded-[24px]">
          <Badge 
            label={loan.status === 'OUTSTANDING' ? t('outstandingStatus') : loan.status === 'PARTIALLY_PAID' ? t('partiallyPaid') : loan.status === 'PAID' ? t('paid') : loan.status === 'OVERDUE' ? t('overdue') : loan.status} 
            variant={loan.status === 'PAID' ? 'success' : loan.status === 'OVERDUE' ? 'danger' : 'warning'} 
            className="mb-4" 
          />
          <Text className="text-gray-500 font-medium mb-2">{t('outstanding')}</Text>
          <AmountText amount={loan.remainingAmount} className="text-gray-900 text-4xl font-extrabold mb-6" showSign={false} />
          
          <View className="flex-row w-full justify-around border-t border-theme-border pt-6">
            <View className="items-center">
              <Text className="text-gray-500 text-xs mb-1">Total {loan.type === 'BORROWED' ? 'Hutang' : t('loanGiven')}</Text>
              <AmountText amount={loan.amount} className="text-gray-900 font-semibold" showSign={false} />
            </View>
            {loan.dueDate && (
              <View className="items-center border-l border-theme-border pl-4 w-1/2">
                <Text className="text-gray-500 text-xs mb-1">{t("deadline")}</Text>
                <Text className="text-gray-900 font-semibold">
                  {new Date(loan.dueDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {loan.status !== 'PAID' && (
          <Button 
            label={t("payInstallment")} 
            className="mb-8 rounded-full" 
            onPress={handleOpenRepayment} 
          />
        )}

        <SectionHeader title={t('repayment')} />
        <Card className="mb-8 p-0 rounded-[24px] border border-theme-border bg-theme-card shadow-none">
          {loan.repayments?.length > 0 ? (
            loan.repayments.map((rp: any, index: number) => (
              <View key={rp.id} className={`flex-row justify-between items-center p-4 ${index !== loan.repayments.length -1 ? 'border-b border-theme-border' : ''}`}>
                <View>
                  <Text className="font-semibold text-gray-900">
                    {new Date(rp.paidDate).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <AmountText amount={rp.amount} className="font-bold text-gray-900" showSign={false} />
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic p-6 text-center">{t('noRepaymentHistory')}</Text>
          )}
        </Card>
        
        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isRepaymentOpen} onClose={() => { setIsRepaymentOpen(false); setIsSelectingAccount(false); }} height={isSelectingAccount ? 500 : 520}>
        {isSelectingAccount ? (
          <View className="p-4 flex-1">
            <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    setAccountId(a.id);
                    setIsSelectingAccount(false);
                  }}
                >
                  <Text className="text-base text-gray-900">{a.name}</Text>
                  <Text className="text-sm font-medium text-gray-500">Rp {Number(a.balance || 0).toLocaleString('id-ID')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="flex-1 p-6">
            <Text className="text-xl font-bold mb-4">{t('repayment')}</Text>
            
            <Input 
              label={t('amount')}
              placeholder="0"
              keyboardType="numeric"
              value={repaymentAmount ? parseInt(repaymentAmount, 10).toLocaleString('id-ID') : ''}
              onChangeText={(text) => setRepaymentAmount(text.replace(/[^0-9]/g, ''))}
              autoFocus
            />

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">{t('account')}</Text>
              <TouchableOpacity 
                className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
                onPress={() => setIsSelectingAccount(true)}
              >
                <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                  {selectedAccount ? selectedAccount.name : t('selectAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            <DatePickerInput 
              label={t('repaymentDate')}
              value={paidDate}
              onChange={setPaidDate as any}
            />

            <View className="mt-4 flex-row gap-4">
              <Button label={t('cancel')} variant="secondary" className="flex-1" onPress={() => setIsRepaymentOpen(false)} />
              <Button label={t('save')} className="flex-1" onPress={handleSaveRepayment} isLoading={repaymentMutation.isPending} disabled={!repaymentAmount || !accountId} />
            </View>
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
