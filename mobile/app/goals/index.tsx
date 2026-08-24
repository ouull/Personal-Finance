import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function GoalsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.goals,
    queryFn: async () => {
      const response = await apiClient.get('/goals');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      setIsOptionsOpen(false);
      setSelectedGoal(null);
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const goals = data?.data || [];

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const handleOptions = (goal: any) => {
    setSelectedGoal(goal);
    setIsOptionsOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedGoal) return;
    Alert.alert(
      'Hapus Tujuan',
      'Apakah Anda yakin ingin menghapus tujuan keuangan ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate(selectedGoal.id) },
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
          <Text className="text-xl font-bold text-gray-900">{t('goals')}</Text>
        </View>
        <TouchableOpacity 
          className="bg-blue-100 p-2 rounded-full"
          onPress={() => router.push('/goals/add')}
        >
          <Plus color="#2563eb" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {goals.map((goal: any) => {
          const progressPercentage = Math.min(Math.round(goal.progress * 100), 100);
          return (
            <TouchableOpacity key={goal.id} onPress={() => handleOptions(goal)}>
              <Card className="mb-4 bg-white border-0 shadow-sm">
                <View className="flex-row justify-between items-start mb-2">
                  <View>
                    <Text className="font-bold text-gray-900 text-lg">{goal.name}</Text>
                    {goal.targetDate && (
                      <Text className="text-gray-500 text-xs">Target: {new Date(goal.targetDate).toLocaleDateString()}</Text>
                    )}
                  </View>
                  <Text className="text-gray-900 font-bold">{progressPercentage}%</Text>
                </View>
                
                {/* Progress Bar */}
                <View className="h-2 w-full bg-gray-100 rounded-full my-3 overflow-hidden">
                  <View className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPercentage}%` }} />
                </View>

                <View className="flex-row justify-between mt-1">
                  <AmountText amount={goal.currentAmount} className="text-sm font-semibold text-gray-900" showSign={false} />
                  <AmountText amount={goal.targetAmount} className="text-sm text-gray-500" showSign={false} />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        
        {goals.length === 0 && !isLoading && (
          <EmptyState title="Belum ada tujuan keuangan." actionLabel="Tambah Tujuan" onAction={() => router.push('/goals/add')} />
        )}

        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={250}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{selectedGoal?.name}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row items-center"
            onPress={() => {
              setIsOptionsOpen(false);
              router.push(`/goals/edit?id=${selectedGoal?.id}`);
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
