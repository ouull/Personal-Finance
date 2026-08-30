import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2, Receipt, ArrowRightLeft, TrendingUp, TrendingDown, Clock, MapPin, Tag, Briefcase } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { Button } from '../../components/ui/button';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const response = await apiClient.get(`/transactions/${id}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      router.back();
    },
    onError: () => {
      Alert.alert(t('errorOccurred'), 'Gagal menghapus transaksi');
    }
  });

  const handleDelete = () => {
    Alert.alert(
      t('deleteTransaction'),
      'Apakah Anda yakin ingin menghapus transaksi ini? Saldo akun akan dikembalikan ke kondisi semula.',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate() }
      ]
    );
  };

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
        <EmptyState title="Transaksi tidak ditemukan" actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const tx = data.data;

  const renderIcon = () => {
    if (tx.type === 'INCOME') return <TrendingUp color="#16a34a" size={28} />;
    if (tx.type === 'EXPENSE') return <TrendingDown color="#dc2626" size={28} />;
    return <ArrowRightLeft color="#2563eb" size={28} />;
  };

  const formattedDate = new Date(tx.date).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-theme-bg border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('transactionDetail')}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} className="bg-red-50 p-2 rounded-full">
          <Trash2 size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-theme-bg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="items-center py-10 px-4 bg-white border-b border-gray-100">
          <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
            tx.type === 'INCOME' ? 'bg-green-50' : 
            tx.type === 'EXPENSE' ? 'bg-red-50' : 'bg-blue-50'
          }`}>
            {renderIcon()}
          </View>
          <Text className="text-gray-500 font-medium mb-1 text-base">{tx.type === 'INITIAL_BALANCE' ? 'Saldo Awal' : tx.type}</Text>
          <AmountText 
            amount={tx.amount} 
            className={`text-4xl font-extrabold ${tx.type === 'INCOME' ? 'text-green-600' : tx.type === 'EXPENSE' ? 'text-red-600' : 'text-gray-900'}`} 
            showSign={tx.type !== 'TRANSFER' && tx.type !== 'INITIAL_BALANCE'}
            sign={tx.type === 'EXPENSE' ? '-' : '+'}
          />
        </View>

        <View className="p-4">
          <Card className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
            
            {/* Tipe Transaksi */}
            <View className="flex-row items-start mb-6">
              <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                <Receipt color="#6b7280" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm mb-1">{t('description')}</Text>
                <Text className="text-gray-900 font-medium text-base">{(typeof tx.description === 'string' ? tx.description.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '').split(' di ')[0] : (tx.description || tx.category?.name || 'Transaksi'))}</Text>
              </View>
            </View>

            {/* Kategori */}
            {tx.category && (
              <View className="flex-row items-start mb-6">
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                  <Tag color="#6b7280" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm mb-1">{t('category')}</Text>
                  <Text className="text-gray-900 font-medium text-base">{tx.category.name}</Text>
                </View>
              </View>
            )}

            {/* Merchant */}
            {tx.merchant && (
              <View className="flex-row items-start mb-6">
                <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                  <MapPin color="#6b7280" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-sm mb-1">Merchant</Text>
                  <Text className="text-gray-900 font-medium text-base">{tx.merchant.name}</Text>
                </View>
              </View>
            )}

            {/* Akun */}
            <View className="flex-row items-start mb-6">
              <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                <Briefcase color="#6b7280" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm mb-1">{t('account')}</Text>
                {tx.type === 'TRANSFER' ? (
                  <Text className="text-gray-900 font-medium text-base">
                    {tx.sourceAccount?.name} ➔ {tx.destinationAccount?.name}
                  </Text>
                ) : (
                  <Text className="text-gray-900 font-medium text-base">
                    {tx.sourceAccount?.name || tx.destinationAccount?.name || '-'}
                  </Text>
                )}
              </View>
            </View>

            {/* Waktu */}
            <View className="flex-row items-start mb-2">
              <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-3">
                <Clock color="#6b7280" size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm mb-1">{t('time')}</Text>
                <Text className="text-gray-900 font-medium text-base">{formattedDate}</Text>
              </View>
            </View>

          </Card>

          {/* Notes */}
          {tx.notes && (
            <Card className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
              <Text className="text-gray-500 text-sm mb-2">{t('notes')}</Text>
              <Text className="text-gray-900 text-base leading-relaxed">{tx.notes}</Text>
            </Card>
          )}

        </View>
      </ScrollView>
    </Screen>
  );
}
