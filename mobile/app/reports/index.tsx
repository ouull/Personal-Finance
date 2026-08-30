import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';

export default function ReportsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.reports({ month, year }),
    queryFn: async () => {
      const response = await apiClient.get(`/reports/spending?month=${month}&year=${year}`);
      return response.data;
    },
  });

  const report = data?.data;
  const breakdown = report?.breakdown || [];
  const totalExpense = report?.totalExpense || 0;

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <View className="flex-row items-center px-4 pt-16 pb-4 bg-theme-bg border-b border-theme-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('reportsExpense')}</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-theme-bg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="flex-row justify-between items-center mb-6 px-2">
          <TouchableOpacity onPress={handlePrevMonth} className="p-2 bg-theme-input rounded-full">
            <ChevronLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">{monthName}</Text>
          <TouchableOpacity onPress={handleNextMonth} className="p-2 bg-theme-input rounded-full">
            <ChevronRight size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        <Card className="mb-6 bg-theme-card border border-theme-border rounded-[24px] p-6 shadow-none items-center">
          <Text className="text-gray-500 font-medium mb-1">{t('totalExpense')}</Text>
          <AmountText amount={totalExpense} className="text-gray-900 text-3xl font-extrabold mb-6" showSign={false} />
          
          {/* Simple Stacked Bar Chart for distribution */}
          {breakdown.length > 0 ? (
            <View className="w-full">
              <View className="h-4 w-full flex-row rounded-full overflow-hidden mb-4">
                {breakdown.map((item: any, index: number) => {
                  const percentage = (item.total / totalExpense) * 100;
                  // Use alternating colors if item.color is not set, or just use predefined palette
                  const colors = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#F3F4F6'];
                  const bgColor = item.color || colors[index % colors.length];
                  
                  return (
                    <View 
                      key={item.categoryId} 
                      style={{ width: `${percentage}%`, backgroundColor: bgColor }}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            <Text className="text-gray-400 italic">{t("noExpensesThisMonth")}</Text>
          )}
        </Card>

        {breakdown.length > 0 && (
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-900 mb-4 ml-1">{t('byCategory')}</Text>
            {breakdown.map((item: any, index: number) => {
              const percentage = (item.total / totalExpense) * 100;
              const colors = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#F3F4F6'];
              const bgColor = item.color || colors[index % colors.length];
              
              return (
                <View key={item.categoryId} className="flex-row justify-between items-center mb-4 p-4 border border-theme-border rounded-2xl bg-theme-card">
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: bgColor }} />
                    <View>
                      <Text className="font-bold text-gray-900">{item.categoryName}</Text>
                      <Text className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <AmountText amount={item.total} showSign={false} className="font-bold text-gray-900" />
                </View>
              );
            })}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </Screen>
  );
}
