import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Edit2 } from 'lucide-react-native';
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

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isUpdateValueOpen, setIsUpdateValueOpen] = useState(false);
  const [newValue, setNewValue] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.investment(id as string),
    queryFn: async () => {
      const response = await apiClient.get(`/investments/${id}`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/investments/${id}`, {
        currentValue: parseFloat(newValue),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investment(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setIsUpdateValueOpen(false);
      setNewValue('');
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

  const investment = data.data;

  const handleOpenUpdate = () => {
    setNewValue(investment.currentValue.toString());
    setIsUpdateValueOpen(true);
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-theme-bg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{investment.name}</Text>
        </View>
        {investment.totalInvested > 0 && (
          <TouchableOpacity onPress={handleOpenUpdate} className="bg-theme-input p-2 rounded-full">
            <Edit2 size={18} color="#111827" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1 bg-theme-bg px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="mb-6 bg-theme-card border border-theme-border rounded-[24px] shadow-none items-center py-8">
          <Text className="text-gray-500 font-medium mb-2">{t('currentValue')}</Text>
          <AmountText amount={investment.currentValue} className="text-gray-900 text-4xl font-extrabold mb-6" showSign={false} />
          
          <View className="flex-row w-full justify-between border-t border-theme-border pt-6 px-1">
            <View className="flex-1 items-center px-1">
              <Text className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider text-center" numberOfLines={2}>{t('totalInvestment')}</Text>
              <AmountText amount={investment.totalInvested} className="text-gray-900 font-bold text-[13px]" showSign={false} numberOfLines={1} adjustsFontSizeToFit />
            </View>
            <View className="flex-1 items-center border-l border-r border-theme-border px-1">
              <Text className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider text-center" numberOfLines={2}>{t('unrealizedGain')}</Text>
              <AmountText amount={investment.unrealizedGain} type={investment.unrealizedGain >= 0 ? 'INCOME' : 'EXPENSE'} className="font-bold text-[13px]" numberOfLines={1} adjustsFontSizeToFit />
            </View>
            <View className="flex-1 items-center px-1">
              <Text className="text-gray-500 text-[10px] mb-1 uppercase tracking-wider text-center" numberOfLines={2}>{t('realizedGain')}</Text>
              <AmountText amount={investment.realizedGain} type={investment.realizedGain >= 0 ? 'INCOME' : 'EXPENSE'} className="font-bold text-[13px]" numberOfLines={1} adjustsFontSizeToFit />
            </View>
          </View>
          
          {investment.cashBalance > 0 && (
            <View className="w-full mt-6 pt-6 border-t border-theme-border items-center">
              <Text className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Saldo Mengendap (Cash Balance)</Text>
              <AmountText amount={investment.cashBalance} className="text-gray-900 font-bold text-lg" showSign={false} />
            </View>
          )}
        </Card>

        <View className="flex-row flex-wrap justify-between mb-8 gap-4 px-2">
          <TouchableOpacity 
            className="flex-1 py-4 bg-red-100 rounded-full items-center justify-center"
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=SELL`)} 
          >
            <Text className="text-red-600 font-bold text-base">{t('sell')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-4 bg-green-100 rounded-full items-center justify-center"
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=BUY`)} 
          >
            <Text className="text-green-700 font-bold text-base">{t('buy')}</Text>
          </TouchableOpacity>
        </View>

        <SectionHeader title="Riwayat Transaksi" />
        <View className="mb-8 mt-2">
          {investment.transactions?.length > 0 ? (
            investment.transactions.map((tx: any, index: number) => {
              const isBuy = tx.type === 'BUY';
              const isSell = tx.type === 'SELL';
              const bgClass = isBuy ? 'bg-green-50 border-green-100' : isSell ? 'bg-red-50 border-red-100' : 'bg-theme-card border-theme-border';
              const textClass = isBuy ? 'text-green-800' : isSell ? 'text-red-800' : 'text-gray-900';
              
              return (
                <View key={tx.id} className={`flex-row justify-between items-center p-5 mb-3 rounded-2xl border ${bgClass}`}>
                  <View>
                    <Text className={`font-bold mb-1 ${textClass}`}>{isBuy ? 'Beli' : isSell ? 'Jual' : tx.type}</Text>
                    <Text className={`text-xs ${isBuy ? 'text-green-600' : isSell ? 'text-red-600' : 'text-gray-500'}`}>{new Date(tx.date).toLocaleDateString()}</Text>
                    {tx.shares > 0 && <Text className={`text-xs mt-1 font-medium ${isBuy ? 'text-green-700' : isSell ? 'text-red-700' : 'text-gray-600'}`}>{tx.shares} unit @ <AmountText amount={tx.price || 0} showSign={false} className="text-xs" /></Text>}
                  </View>
                  <AmountText amount={tx.amount} className={`font-extrabold text-base ${textClass}`} showSign={false} />
                </View>
              );
            })
          ) : (
            <Text className="text-gray-500 italic p-4 text-center">{t('noTransactionsYet')}</Text>
          )}
        </View>
        
        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isUpdateValueOpen} onClose={() => setIsUpdateValueOpen(false)} height={320}>
        <View className="p-6">
          <Text className="text-xl font-bold mb-4">{t('updateValue')}</Text>
          <Text className="text-gray-500 mb-4 text-sm">
            Perbarui nilai pasar investasi ini secara manual jika tidak terhubung ke API otomatis.
          </Text>
          <Input 
            placeholder="0"
            keyboardType="numeric"
            value={newValue ? parseInt(newValue, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setNewValue(text.replace(/[^0-9]/g, ''))}
            autoFocus
          />
          <View className="mt-4 flex-row gap-4">
            <Button label={t('cancel')} variant="secondary" className="flex-1" onPress={() => setIsUpdateValueOpen(false)} />
            <Button label={t('save')} className="flex-1" onPress={() => updateMutation.mutate()} isLoading={updateMutation.isPending} disabled={!newValue} />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
