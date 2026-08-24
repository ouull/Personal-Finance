import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { Badge } from '../../components/ui/badge';

export default function LendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.lending,
    queryFn: async () => {
      const response = await apiClient.get('/lending');
      return response.data;
    },
  });

  const loans = data?.data || [];
  const given = loans.filter((l: any) => l.type === 'LOAN_GIVEN');
  const taken = loans.filter((l: any) => l.type === 'LOAN_TAKEN');

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const renderLoanList = (list: any[], title: string) => {
    if (list.length === 0) return null;
    return (
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-500 mb-3 ml-1 uppercase">{title}</Text>
        {list.map((loan) => (
          <TouchableOpacity key={loan.id} onPress={() => router.push(`/lending/${loan.id}`)}>
            <Card className="mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="font-bold text-gray-900 text-lg">{loan.name}</Text>
                  <Text className="text-gray-500 text-xs">
                    {loan.type === 'LOAN_GIVEN' ? t('loanGiven') : t('loanTaken')}
                  </Text>
                </View>
                <Badge 
                  label={loan.status} 
                  variant={loan.status === 'PAID' ? 'success' : 'warning'} 
                />
              </View>
              <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                <Text className="text-gray-500 text-xs">{t('outstanding')}: <AmountText amount={loan.outstandingAmount} showSign={false} /></Text>
                <Text className="text-gray-500 text-xs">Total: <AmountText amount={loan.amount} showSign={false} /></Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('lending')}</Text>
        </View>
        <TouchableOpacity 
          className="bg-blue-100 p-2 rounded-full"
          onPress={() => router.push('/lending/add')}
        >
          <Plus color="#2563eb" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {renderLoanList(given, t('loanGiven'))}
        {renderLoanList(taken, t('loanTaken'))}
        
        {loans.length === 0 && !isLoading && (
          <EmptyState title="Belum ada catatan pinjaman." actionLabel="Tambah Pinjaman" onAction={() => router.push('/lending/add')} />
        )}

        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
