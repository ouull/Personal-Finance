import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, ArrowUpRight, ArrowDownRight, User, CheckCircle2, CreditCard } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { Badge } from '../../components/ui/badge';

export default function LendingScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.lending,
    queryFn: async () => {
      const response = await apiClient.get('/lending');
      return response.data;
    },
  });

  const loans = data?.data || [];

  if (isError) {
    return (
      <Screen className="justify-center items-center bg-[#FDF8EB]">
        <Text className="text-gray-500 mb-4">{t('errorOccurred')}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-black px-4 py-2 rounded-full">
          <Text className="text-white font-medium">{t('tryAgain')}</Text>
        </TouchableOpacity>
      </Screen>
    );
  }

  const lentLoans = loans.filter((l: any) => l.type === 'LENT' || !l.type);
  const borrowedLoans = loans.filter((l: any) => l.type === 'BORROWED');

  const totalLent = lentLoans.reduce((acc: number, curr: any) => acc + curr.remainingAmount, 0);
  const totalBorrowed = borrowedLoans.reduce((acc: number, curr: any) => acc + curr.remainingAmount, 0);

  const renderLoanList = (list: any[]) => {
    return list.map((loan) => {
      const progress = loan.amount > 0 ? (loan.totalRepaid / loan.amount) * 100 : 0;
      
      return (
        <TouchableOpacity key={loan.id} onPress={() => router.push(`/lending/${loan.id}`)}>
          <Card className="mb-4 bg-transparent border border-[#E5E0D5] rounded-[24px] p-5 shadow-none">
            <View className="flex-row justify-between items-start mb-1">
              <View className="flex-1 mr-2">
                <Text className="font-bold text-gray-900 text-[17px]" numberOfLines={1}>{loan.borrowerName}</Text>
              </View>
              <Badge 
                label={loan.status === 'OUTSTANDING' ? t('outstandingStatus') : loan.status === 'PARTIALLY_PAID' ? 'Dibayar Sebagian' : loan.status === 'PAID' ? t('paid') : loan.status === 'OVERDUE' ? t('overdue') : loan.status} 
                variant={loan.status === 'PAID' ? 'success' : loan.status === 'OVERDUE' ? 'danger' : 'warning'} 
              />
            </View>
            <Text className="text-gray-600 text-[13px] mb-0.5">{loan.notes || (loan.type === 'BORROWED' ? 'Debt' : 'Loan')}</Text>
            {loan.dueDate && (
              <Text className="text-gray-500 text-[12px] mb-4">
                Tenggat: {new Date(loan.dueDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}

            <View className="mt-2 mb-4">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-gray-600 text-xs font-medium">{t('repaymentProgress')}</Text>
                <Text className="text-gray-900 font-bold text-xs">{Math.round(progress)}%</Text>
              </View>
              <View className="h-2 bg-[#EAE5D9] rounded-full overflow-hidden mb-2">
                <View className="h-full bg-[#5C5549] rounded-full" style={{ width: `${progress}%` }} />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-500 text-[11px] font-medium">Rp{loan.totalRepaid.toLocaleString('id-ID')} paid</Text>
                <Text className="text-gray-500 text-[11px] font-medium">Rp{loan.amount.toLocaleString('id-ID')} total</Text>
              </View>
            </View>

            {loan.repayments && loan.repayments.length > 0 && (
              <View className="mt-2">
                <Text className="text-gray-900 font-bold text-sm mb-3">{t('recentPayments')}</Text>
                {loan.repayments.slice(0, 3).map((r: any, idx: number) => (
                  <View key={r.id} className={`flex-row justify-between items-center py-2.5 ${idx !== Math.min(loan.repayments.length, 3) - 1 ? 'border-b border-[#E5E0D5]' : ''}`}>
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-8 h-8 rounded-full bg-[#EAE5D9] items-center justify-center mr-3">
                        <CreditCard color="#6b7280" size={14} />
                      </View>
                      <View>
                        <Text className="text-gray-800 text-[13px] font-medium mb-0.5">{loan.type === 'LENT' ? t('paymentReceived') : t('paymentSent')}</Text>
                        <Text className="text-gray-500 text-[11px]">{new Date(r.paidDate).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </View>
                    <Text className="text-gray-700 font-medium text-[13px]">+Rp{Number(r.amount).toLocaleString('id-ID')}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      );
    });
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-[#FDF8EB]">
        <View className="flex-row items-center w-8">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
        </View>
        <Text className="text-base font-medium text-gray-900 flex-1 text-center">{t('lendingAndDebts')}</Text>
        <View className="flex-row items-center justify-end w-8">
          <TouchableOpacity 
            className="bg-black w-8 h-8 rounded-full items-center justify-center"
            onPress={() => router.push('/lending/add')}
          >
            <Plus color="#ffffff" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4 bg-[#FDF8EB]"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="flex-row justify-between space-x-2 mb-6">
          <Card className="flex-1 bg-transparent border border-[#E5E0D5] p-4 rounded-[16px] shadow-none mr-2">
            <View className="flex-row items-center mb-2">
              <ArrowUpRight size={14} color="#6b7280" className="mr-1" />
              <Text className="text-gray-600 font-medium text-[13px]">{t('owedToMe')}</Text>
            </View>
            <AmountText amount={totalLent} showSign={false} className="text-gray-900 font-bold text-xl" />
          </Card>
          
          <Card className="flex-1 bg-transparent border border-[#E5E0D5] p-4 rounded-[16px] shadow-none ml-2">
            <View className="flex-row items-center mb-2">
              <ArrowDownRight size={14} color="#6b7280" className="mr-1" />
              <Text className="text-gray-600 font-medium text-[13px]">{t('iOwe')}</Text>
            </View>
            <AmountText amount={totalBorrowed} showSign={false} className="text-gray-900 font-bold text-xl" />
          </Card>
        </View>

        {loans.length > 0 ? (
          renderLoanList(loans)
        ) : (
          !isLoading && (
            <View className="items-center justify-center py-16">
              <View className="w-24 h-24 rounded-full bg-[#EAE5D9] items-center justify-center mb-4">
                <CheckCircle2 color="#4b5563" size={40} />
              </View>
              <Text className="text-gray-600 font-bold text-base mb-1">No active debts</Text>
              <Text className="text-gray-500 text-xs text-center px-8">You are all caught up on your personal debts.</Text>
            </View>
          )
        )}
        
        <View className="h-24" />
      </ScrollView>
    </Screen>
  );
}
