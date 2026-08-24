import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';
import { Badge } from '../../components/ui/badge';

export default function DashboardScreen() {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await apiClient.get('/dashboard');
      return response.data;
    },
  });

  const dashboardData = data?.data;

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
        <Text className="text-3xl font-bold mb-6 text-gray-900">{t('dashboard')}</Text>

        {/* Hero Section */}
        <Card className="mb-6 bg-blue-600 border-0">
          <Text className="text-blue-100 font-medium mb-1">{t('netWorth')}</Text>
          <AmountText
            amount={dashboardData?.netWorth || 0}
            className="text-white text-4xl font-bold"
            showSign={false}
          />
        </Card>

        {/* Financial Summary */}
        <View className="flex-row justify-between mb-8 gap-3">
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('availableCash')}</Text>
            <AmountText amount={dashboardData?.cash || 0} className="text-gray-900 font-bold text-lg" />
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('investedCapital')}</Text>
            <AmountText amount={dashboardData?.invested || 0} className="text-gray-900 font-bold text-lg" />
          </Card>
          <Card className="flex-1">
            <Text className="text-xs text-gray-500 mb-1">{t('receivables')}</Text>
            <AmountText amount={dashboardData?.receivables || 0} className="text-gray-900 font-bold text-lg" />
          </Card>
        </View>

        {/* Cash Flow */}
        <SectionHeader title={t('monthlyCashFlow')} />
        <Card className="mb-8 flex-row justify-between">
          <View>
            <Text className="text-sm text-gray-500 mb-1">{t('monthlyIncome')}</Text>
            <AmountText amount={dashboardData?.monthlyIncome || 0} type="INCOME" className="font-bold text-lg" />
          </View>
          <View className="items-end">
            <Text className="text-sm text-gray-500 mb-1">{t('monthlyExpense')}</Text>
            <AmountText amount={dashboardData?.monthlyExpense || 0} type="EXPENSE" className="font-bold text-lg" />
          </View>
        </Card>

        {/* Top Spending */}
        {dashboardData?.topExpenseCategories?.length > 0 && (
          <>
            <SectionHeader title={t('topSpending')} />
            <Card className="mb-8">
              {dashboardData.topExpenseCategories.map((cat: any, index: number) => (
                <View key={cat.categoryId} className={`flex-row justify-between items-center py-3 ${index !== dashboardData.topExpenseCategories.length -1 ? 'border-b border-gray-100' : ''}`}>
                  <View>
                    <Text className="font-medium text-gray-900">{cat.categoryName}</Text>
                    <Text className="text-xs text-gray-500">{Math.round(cat.percentage)}%</Text>
                  </View>
                  <AmountText amount={cat.totalAmount} type="EXPENSE" className="font-semibold" />
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recent Transactions */}
        <SectionHeader title={t('recentTransactions')} />
        <Card className="mb-8">
          {dashboardData?.recentTransactions?.length > 0 ? (
            dashboardData.recentTransactions.map((tx: any, index: number) => (
              <View key={tx.id} className={`flex-row justify-between items-center py-3 ${index !== dashboardData.recentTransactions.length -1 ? 'border-b border-gray-100' : ''}`}>
                <View>
                  <Text className="font-medium text-gray-900">
                    {tx.category ? tx.category.displayName : tx.type}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {new Date(tx.date).toLocaleDateString()} • {tx.account?.name || '-'}
                  </Text>
                </View>
                <AmountText amount={tx.amount} type={tx.type} className="font-semibold" />
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic py-2">{t('noTransactions')}</Text>
          )}
        </Card>

        {/* Upcoming Payments Placeholder */}
        <SectionHeader title={t('upcomingPayments')} />
        <Card className="mb-8 items-center py-6">
          <Text className="text-gray-400 italic">Belum ada tagihan mendatang.</Text>
        </Card>
        
        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
