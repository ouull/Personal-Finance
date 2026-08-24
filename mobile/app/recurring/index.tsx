import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Play, Trash2 } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { Badge } from '../../components/ui/badge';
import { getLocalizedError } from '../../lib/api/errors';

export default function RecurringScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedRecurring, setSelectedRecurring] = useState<any>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.recurring,
    queryFn: async () => {
      const response = await apiClient.get('/recurring');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/recurring/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring });
      setIsOptionsOpen(false);
      setSelectedRecurring(null);
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const processMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post(`/recurring/${id}/process`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      setIsOptionsOpen(false);
      setSelectedRecurring(null);
      Alert.alert('Sukses', 'Pembayaran rutin berhasil diproses.');
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const recurringPayments = data?.data || [];

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const handleOptions = (recurring: any) => {
    setSelectedRecurring(recurring);
    setIsOptionsOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedRecurring) return;
    Alert.alert(
      'Hapus Pembayaran Rutin',
      'Apakah Anda yakin ingin menghapus jadwal ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(selectedRecurring.id) },
      ]
    );
  };

  const confirmProcess = () => {
    if (!selectedRecurring) return;
    Alert.alert(
      t('processPayment'),
      'Proses pembayaran rutin ini sekarang?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: 'Proses', onPress: () => processMutation.mutate(selectedRecurring.id) },
      ]
    );
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('recurring')}</Text>
        </View>
        <TouchableOpacity 
          className="bg-blue-100 p-2 rounded-full"
          onPress={() => router.push('/recurring/add')}
        >
          <Plus color="#2563eb" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {recurringPayments.map((rp: any) => {
          return (
            <TouchableOpacity key={rp.id} onPress={() => handleOptions(rp)}>
              <Card className="mb-4 bg-white border-0 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="font-bold text-gray-900 text-lg">{rp.name}</Text>
                    <Text className="text-gray-500 text-xs">{rp.frequency}</Text>
                  </View>
                  <Badge label={rp.status} variant={rp.status === 'ACTIVE' ? 'success' : 'neutral'} />
                </View>
                
                <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-100">
                  <View>
                    <Text className="text-gray-500 text-xs mb-1">{t('nextDueDate')}</Text>
                    <Text className="font-medium text-gray-900">{new Date(rp.nextDueDate).toLocaleDateString()}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-500 text-xs mb-1">{t('amount')}</Text>
                    <AmountText amount={rp.amount} type={rp.type === 'INCOME' ? 'INCOME' : 'EXPENSE'} className="font-semibold" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        
        {recurringPayments.length === 0 && !isLoading && (
          <EmptyState title="Belum ada pembayaran rutin." actionLabel="Tambah Pembayaran Rutin" onAction={() => router.push('/recurring/add')} />
        )}

        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={280}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{selectedRecurring?.name}</Text>
          
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={confirmProcess}
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? (
              <ActivityIndicator size="small" color="#2563eb" className="mr-2" />
            ) : (
              <Play color="#2563eb" size={20} />
            )}
            <Text className="text-base text-blue-600 ml-2">{t('processPayment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={() => {
              setIsOptionsOpen(false);
              router.push(`/recurring/edit?id=${selectedRecurring?.id}`);
            }}
          >
            <Text className="text-base text-gray-900 ml-2">{t('edit')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={confirmDelete}
          >
            <Trash2 color="#ef4444" size={20} />
            <Text className="text-base text-red-500 ml-2">{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </Screen>
  );
}
