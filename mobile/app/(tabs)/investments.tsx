import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bell, Briefcase, Bitcoin, LineChart as ChartIcon, Trash2 } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Button } from '../../components/ui/button';
import { PressableCard } from '../../components/ui/card';
import { LineChart } from 'react-native-chart-kit';

export default function InvestmentsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timeFilter, setTimeFilter] = useState('6M');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments });
    },
    onError: () => {
      Alert.alert('Error', 'Gagal menghapus aset');
    }
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      t('deleteAsset'),
      `Apakah Anda yakin ingin menghapus ${name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(id) }
      ]
    );
  };

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

  const getPercentString = () => {
    if (!summary.totalInvested) return '+0.0%';
    const pct = (summary.unrealizedGain / summary.totalInvested) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const getChartData = () => {
    const baseValue = summary.currentValue || 10000000;
    const points = timeFilter === '1M' ? 5 : timeFilter === '3M' ? 10 : timeFilter === '6M' ? 15 : timeFilter === '1Y' ? 20 : 30;
    let data = [];
    let current = baseValue * 0.8;
    for (let i = 0; i < points; i++) {
      current = current + (Math.random() - 0.4) * (baseValue * 0.05);
      data.push(Math.max(0, current));
    }
    data.push(baseValue); // Ensure last point matches current value
    return data;
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-1 bg-theme-bg">
        <ScrollView className="flex-1 px-4 pt-16" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-gray-900">{t('wealth')}</Text>
          <View className="w-10 h-10 bg-theme-input rounded-full items-center justify-center">
            <Bell size={20} color="#111827" />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-8 bg-theme-card border border-theme-border rounded-[24px] p-6">
            <Text className="text-gray-500 font-medium mb-1 text-sm">{t('totalPortfolioValue')}</Text>
            <View className="flex-row items-center pr-4">
              <View className="flex-1 mr-3">
                <AmountText
                  amount={summary.currentValue}
                  className="text-4xl font-extrabold tracking-tight text-black"
                  showSign={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                />
              </View>
              <View className="bg-theme-bg px-2 py-1 rounded-full flex-shrink-0">
                <Text className="text-gray-900 font-medium text-xs">↗ {getPercentString()}</Text>
              </View>
            </View>

            {/* Chart */}
            <View className="mt-6 mb-4 items-center justify-center -ml-8 -mr-8 overflow-hidden">
              <LineChart
                data={{
                  labels: [],
                  datasets: [{ data: getChartData() }]
                }}
                width={Dimensions.get("window").width}
                height={140}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: '#FDFBF7',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientTo: '#FDFBF7',
                  backgroundGradientToOpacity: 0,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: { r: "0" }
                }}
                bezier
                style={{ paddingRight: 0, paddingLeft: 0, margin: 0 }}
              />
            </View>

            {/* Time Filter */}
            <View className="flex-row justify-between items-center mt-2 px-2">
              {['1M', '3M', '6M', '1Y', 'ALL'].map((time) => (
                <TouchableOpacity key={time} onPress={() => setTimeFilter(time)}>
                  <View className={time === timeFilter ? 'bg-theme-bg px-4 py-1.5 rounded-full' : 'px-2 py-1.5'}>
                    <Text className={`font-semibold text-xs ${time === timeFilter ? 'text-black' : 'text-gray-500'}`}>{time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-900">{t('yourAssets')}</Text>
          </View>

          {investments.length > 0 ? (
            <Card className="mb-6 p-0 rounded-[24px] border border-theme-border bg-theme-card overflow-hidden shadow-none">
              {investments.map((inv: any, index: number) => {
                const invPct = inv.totalInvested ? (inv.unrealizedGain / inv.totalInvested) * 100 : 0;
                const invPctStr = `${invPct >= 0 ? '↑' : '↓'}${Math.abs(invPct).toFixed(0)}%`;
                
                return (
                  <TouchableOpacity 
                    key={inv.id} 
                    onPress={() => router.push(`/investments/${inv.id}`)}
                    className={`flex-row justify-between items-center p-4 ${index > 0 ? 'border-t border-theme-border' : ''}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-theme-input rounded-full items-center justify-center mr-4">
                        <Briefcase color="#4b5563" size={20} />
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>{inv.name}</Text>
                        <Text className="text-gray-500 text-sm">{inv.units || '0'} Lot</Text>
                      </View>
                    </View>
                    <View className="items-end justify-center mr-3">
                      <AmountText amount={inv.currentValue} className="font-semibold text-gray-900 text-base" showSign={false} />
                      <Text className={`text-sm ${invPct >= 0 ? 'text-gray-500' : 'text-red-500'}`}>{invPctStr}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(inv.id, inv.name)} className="p-2 -mr-1 bg-red-50 rounded-full" disabled={deleteMutation.isPending}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </Card>
          ) : (
            <Card className="mb-6 rounded-[24px] shadow-none">
              {!isLoading && (
                <EmptyState title={t("noInvestments")} actionLabel={t("addInvestment")} onAction={() => router.push('/investments/add')} />
              )}
            </Card>
          )}

          <View className="mt-2">
            <Button label={t("addInvestment")} className="w-full rounded-full" onPress={() => router.push('/investments/add')} />
          </View>

          <View className="h-10" />
        </ScrollView>
      </View>
    </Screen>
  );
}
