import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';

export default function InvestmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.investments,
    queryFn: async () => {
      const response = await apiClient.get('/investments');
      return response.data;
    },
  });

  const investments = data?.data?.items || [];
  const summary = data?.data?.summary || { totalInvested: 0, currentValue: 0, realizedGain: 0, unrealizedGain: 0 };

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <ScrollView
        className="flex-1 px-4 pt-12 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <SectionHeader 
          title={t('investments')} 
          action={
            <TouchableOpacity 
              className="bg-blue-100 p-2 rounded-full"
              onPress={() => router.push('/investments/add')}
            >
              <Plus color="#2563eb" size={20} />
            </TouchableOpacity>
          } 
        />

        <Card className="mb-8 mt-4 bg-gray-900 border-0">
          <Text className="text-gray-400 font-medium mb-1">{t('currentValue')}</Text>
          <AmountText amount={summary.currentValue} className="text-white text-3xl font-bold mb-4" showSign={false} />
          
          <View className="flex-row justify-between pt-4 border-t border-gray-800">
            <View>
              <Text className="text-gray-500 text-xs mb-1">{t('totalInvestment')}</Text>
              <AmountText amount={summary.totalInvested} className="text-gray-300 font-semibold" showSign={false} />
            </View>
            <View className="items-end">
              <Text className="text-gray-500 text-xs mb-1">{t('realizedGain')}</Text>
              <AmountText 
                amount={summary.realizedGain} 
                type={summary.realizedGain >= 0 ? 'INCOME' : 'EXPENSE'} 
                className="font-semibold" 
              />
            </View>
          </View>
        </Card>

        {investments.length > 0 && (
          <Text className="text-sm font-semibold text-gray-500 mb-3 ml-1 uppercase">{t('portfolio')}</Text>
        )}

        {investments.map((inv: any) => {
          return (
            <TouchableOpacity key={inv.id} onPress={() => router.push(`/investments/${inv.id}`)}>
              <Card className="mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <View>
                    <Text className="font-bold text-gray-900 text-lg">{inv.name}</Text>
                    <Text className="text-gray-500 text-xs">{inv.symbol}</Text>
                  </View>
                  <AmountText amount={inv.currentValue} className="font-bold text-lg" showSign={false} />
                </View>
                <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                  <Text className="text-gray-500 text-xs">Unrealized: <AmountText amount={inv.unrealizedGain} type={inv.unrealizedGain >= 0 ? 'INCOME' : 'EXPENSE'} className="text-sm font-semibold" /></Text>
                  <Text className="text-gray-500 text-xs">Realized: <AmountText amount={inv.realizedGain} type={inv.realizedGain >= 0 ? 'INCOME' : 'EXPENSE'} /></Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {investments.length === 0 && !isLoading && (
          <EmptyState title="Belum ada investasi." actionLabel="Tambah Investasi" onAction={() => router.push('/investments/add')} />
        )}

        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
