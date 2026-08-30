import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2, Target } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
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
      t('deleteGoal'),
      'Apakah Anda yakin ingin menghapus tujuan keuangan ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(selectedGoal.id) },
      ]
    );
  };

  const totalSaved = goals.reduce((sum: number, goal: any) => sum + Number(goal.currentAmount || 0), 0);
  const totalTarget = goals.reduce((sum: number, goal: any) => sum + Number(goal.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-theme-bg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          className="bg-black p-2 rounded-full"
          onPress={() => router.push('/goals/add')}
        >
          <Plus color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-2 bg-theme-bg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Top Summary Card */}
        <View className="bg-[#EAE5D9] rounded-[24px] p-5 mb-6">
          <Text className="text-gray-500 font-medium mb-1">{t('totalSavedGoals')}</Text>
          <AmountText amount={totalSaved} showSign={false} className="text-3xl font-bold text-gray-900" />
          
          <View className="h-[1px] bg-[#D5D0C5] my-4" />
          
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-gray-500 font-medium text-xs mb-1">{t('totalGoalTarget')}</Text>
              <AmountText amount={totalTarget} showSign={false} className="font-semibold text-gray-900" />
            </View>
            <View className="items-end">
              <Text className="text-gray-500 font-medium text-xs mb-1 uppercase tracking-wider">{t('overallProgress')}</Text>
              <Text className="font-semibold text-gray-900">{overallProgress}%</Text>
            </View>
          </View>
          
          <View className="h-1.5 bg-[#D5D0C5] rounded-full w-full overflow-hidden mt-1">
            <View 
              className="h-full bg-[#3F2F1B] rounded-full" 
              style={{ width: `${overallProgress}%` }} 
            />
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4">{t('activeGoals')}</Text>

        {goals.map((goal: any) => {
          const progressPercentage = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100) || 0, 100);
          
          return (
            <TouchableOpacity 
              key={goal.id} 
              onPress={() => router.push(`/goals/${goal.id}`)} 
              onLongPress={() => handleOptions(goal)}
              activeOpacity={0.8}
            >
              <View className="mb-4 bg-[#EAE5D9] rounded-[24px] p-5">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-[#FDF8EB] items-center justify-center mr-3">
                      <Target color="#3F2F1B" size={20} />
                    </View>
                    <Text className="font-semibold text-gray-900 text-base">{goal.name}</Text>
                  </View>
                  <Text className="text-xs text-gray-600 font-medium mt-1">
                    {t('target')}: {goal.deadline ? new Date(goal.deadline).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' }) : t('ongoing')}
                  </Text>
                </View>
                
                <View className="flex-row items-end mb-2">
                  <AmountText amount={goal.currentAmount} showSign={false} className="font-bold text-gray-900 text-sm" />
                  <AmountText amount={goal.targetAmount} showSign={false} className="text-gray-500 text-xs ml-1 mb-[1px]" prefix="/ Rp" />
                </View>

                {/* Progress Bar */}
                <View className="h-1.5 bg-[#D5D0C5] rounded-full w-full overflow-hidden">
                  <View 
                    className="h-full bg-[#3F2F1B] rounded-full" 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </View>
                
                <TouchableOpacity 
                  className="border border-gray-900 rounded-full py-2.5 mt-5 items-center justify-center"
                  onPress={() => router.push(`/goals/${goal.id}`)}
                >
                  <Text className="text-gray-900 font-semibold">{t('addFunds')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        
        {goals.length === 0 && !isLoading && (
          <EmptyState title={t('noGoals')} actionLabel={t('addGoal')} onAction={() => router.push('/goals/add')} />
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
