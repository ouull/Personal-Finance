import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Play, Trash2, PenLine, Clapperboard, CalendarDays, Zap, Dumbbell, Receipt } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/auth-store';

export default function RecurringScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

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
    },
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
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

  const totalMonthly = recurringPayments.reduce((acc: number, rp: any) => {
    let amount = Number(rp.amount);
    if (rp.frequency === 'WEEKLY') amount *= 4.33;
    if (rp.frequency === 'YEARLY') amount /= 12;
    return acc + amount;
  }, 0);

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
      t('deleteRecurring'),
      'Apakah Anda yakin ingin menghapus jadwal ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(selectedRecurring.id) },
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
      <View className="flex-1 bg-[#FDF8EB]">
        <ScrollView className="flex-1 px-4 pt-14" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-10">
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
               <Image source={{ uri: profileData?.data?.user?.image || user?.image || 'https://i.pravatar.cc/150?img=68' }} className="flex-1" />
            </View>
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-gray-900 absolute w-full text-center" pointerEvents="none">{t('recurring')}</Text>
          <TouchableOpacity 
            className="bg-black w-8 h-8 rounded-full items-center justify-center"
            onPress={() => router.push('/recurring/add')}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Text className="text-[26px] font-bold text-gray-900 mb-1">{t('upcomingPayments')}</Text>
            <Text className="text-[15px] text-gray-600 mb-6 font-medium">{t('manageSubscriptions')}</Text>
            
            <Text className="text-[11px] font-bold text-gray-600 tracking-wider mb-1">{t('totalMonthly')}</Text>
            <AmountText
              amount={totalMonthly}
              className="text-4xl font-extrabold tracking-tight text-black mb-8"
              showSign={false}
            />
          </Animated.View>

          {recurringPayments.map((rp: any, index: number) => {
            const nextDate = new Date(rp.nextDueDate);
            const today = new Date();
            const diffTime = nextDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const isSoon = diffDays <= 7 && diffDays >= 0;
            const dueText = diffDays === 0 ? (t('dueToday' as any) || 'Due today') : diffDays < 0 ? `${t('overdue' as any) || 'Overdue'} ${Math.abs(diffDays)} ${t('days' as any) || 'days'}` : `${t('dueIn' as any) || 'Due in'} ${diffDays} ${t('days' as any) || 'days'}`;
            
            let IconComponent = Receipt;
            const nameLower = rp.name.toLowerCase();
            const catLower = rp.category?.name?.toLowerCase() || '';
            
            if (nameLower.includes('netflix') || catLower.includes('entertainment') || nameLower.includes('spotify')) IconComponent = Clapperboard;
            if (nameLower.includes('electric') || nameLower.includes('listrik') || catLower.includes('utility')) IconComponent = Zap;
            if (nameLower.includes('gym') || catLower.includes('health') || catLower.includes('fitness')) IconComponent = Dumbbell;

            const dateStr = nextDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

            return (
              <Animated.View key={rp.id} entering={FadeInUp.delay((index + 1) * 100).springify()}>
                <Card className="mb-4 bg-transparent border border-[#E5E0D5] rounded-[20px] p-5 shadow-none">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="w-12 h-12 bg-[#E5E0D5] rounded-[14px] items-center justify-center">
                      <IconComponent color="#111827" size={24} />
                    </View>
                    <View className="flex-row gap-2 mt-1">
                      <View className={`px-3 py-1.5 rounded-full ${isSoon ? 'bg-[#FCE7F3]' : 'bg-[#E5E0D5]'}`}>
                        <Text className={`font-semibold text-[11px] ${isSoon ? 'text-pink-900' : 'text-gray-700'}`}>{dueText}</Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${isSoon ? 'bg-[#F9ECEC]' : 'bg-[#E5E0D5]'}`}>
                        <Text className="text-gray-800 font-semibold text-[11px]">{dateStr}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text className="font-bold text-gray-900 text-lg mb-1">{rp.name}</Text>
                  <Text className="text-gray-500 text-[13px] font-medium mb-5">
                    {rp.category?.name || 'Utility'} • {rp.frequency ? rp.frequency.charAt(0) + rp.frequency.slice(1).toLowerCase() : 'Monthly'}
                  </Text>
                  
                  <View className="flex-row justify-between items-end border-t border-[#E5E0D5] pt-5 mt-1">
                    <AmountText amount={rp.amount} type="EXPENSE" className="font-bold text-[17px] text-gray-900" showSign={false} />
                    <TouchableOpacity onPress={() => handleOptions(rp)}>
                      <PenLine color="#111827" size={20} />
                    </TouchableOpacity>
                  </View>
                </Card>
              </Animated.View>
            );
          })}
          
          {recurringPayments.length === 0 && !isLoading && (
            <EmptyState title={t("noRecurring")} actionLabel={t("addRecurring")} onAction={() => router.push('/recurring/add')} />
          )}

          <View className="h-24" />
        </ScrollView>
      </View>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={280}>
        <View className="p-6 pt-2">
          <Text className="text-xl font-bold mb-6 text-gray-900">{selectedRecurring?.name}</Text>
          
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={confirmProcess}
            disabled={processMutation.isPending}
          >
            {processMutation.isPending ? (
              <ActivityIndicator size="small" color="#2563eb" className="mr-3" />
            ) : (
              <Play color="#2563eb" size={22} />
            )}
            <Text className="text-base font-medium text-blue-600 ml-3">{t('processPayment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={() => {
              setIsOptionsOpen(false);
              router.push(`/recurring/edit?id=${selectedRecurring?.id}`);
            }}
          >
            <PenLine color="#111827" size={22} />
            <Text className="text-base font-medium text-gray-900 ml-3">{t('edit')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="py-4 flex-row items-center"
            onPress={confirmDelete}
          >
            <Trash2 color="#ef4444" size={22} />
            <Text className="text-base font-medium text-red-500 ml-3">{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </Screen>
  );
}
