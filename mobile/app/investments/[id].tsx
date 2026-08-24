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
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-blue-600">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">{investment.name}</Text>
        </View>
        <TouchableOpacity onPress={handleOpenUpdate}>
          <Edit2 size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50 px-4 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="mb-6 bg-white border-0 shadow-sm items-center py-6">
          <Text className="text-gray-500 font-medium mb-1">{t('currentValue')}</Text>
          <AmountText amount={investment.currentValue} className="text-gray-900 text-4xl font-bold mb-6" showSign={false} />
          
          <View className="flex-row w-full justify-around border-t border-gray-100 pt-4">
            <View className="items-center">
              <Text className="text-gray-500 text-xs mb-1">Total Investasi</Text>
              <AmountText amount={investment.totalInvested} className="text-gray-900 font-semibold" showSign={false} />
            </View>
            <View className="items-center border-l border-r border-gray-100 px-4">
              <Text className="text-gray-500 text-xs mb-1">Unrealized</Text>
              <AmountText amount={investment.unrealizedGain} type={investment.unrealizedGain >= 0 ? 'INCOME' : 'EXPENSE'} className="font-semibold" />
            </View>
            <View className="items-center">
              <Text className="text-gray-500 text-xs mb-1">{t('realizedGain')}</Text>
              <AmountText amount={investment.realizedGain} type={investment.realizedGain >= 0 ? 'INCOME' : 'EXPENSE'} className="font-semibold" />
            </View>
          </View>
        </Card>

        <View className="flex-row flex-wrap justify-between mb-8">
          <Button 
            label={t('buy')} 
            className="w-[48%] mb-3" 
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=BUY`)} 
          />
          <Button 
            label={t('sell')} 
            variant="secondary" 
            className="w-[48%] mb-3" 
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=SELL`)} 
          />
          <Button 
            label={t('deposit')} 
            variant="outline" 
            className="w-[48%]" 
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=DEPOSIT`)} 
          />
          <Button 
            label={t('withdraw')} 
            variant="outline" 
            className="w-[48%]" 
            onPress={() => router.push(`/investments/transaction?id=${investment.id}&type=WITHDRAW`)} 
          />
        </View>

        <SectionHeader title="Riwayat Transaksi" />
        <Card className="mb-8 p-0">
          {investment.transactions?.length > 0 ? (
            investment.transactions.map((tx: any, index: number) => (
              <View key={tx.id} className={`flex-row justify-between items-center p-4 ${index !== investment.transactions.length -1 ? 'border-b border-gray-100' : ''}`}>
                <View>
                  <Text className="font-semibold text-gray-900">{tx.type}</Text>
                  <Text className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</Text>
                  {tx.shares > 0 && <Text className="text-xs text-gray-500">{tx.shares} unit @ <AmountText amount={tx.price || 0} showSign={false} /></Text>}
                </View>
                <AmountText amount={tx.amount} type={tx.type === 'BUY' || tx.type === 'WITHDRAW' ? 'EXPENSE' : 'INCOME'} className="font-bold" />
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic p-4">Belum ada transaksi.</Text>
          )}
        </Card>
        
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
            value={newValue}
            onChangeText={setNewValue}
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
