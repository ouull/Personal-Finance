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

export default function BudgetsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.budgets({ month, year }),
    queryFn: async () => {
      const response = await apiClient.get(`/budgets?month=${month}&year=${year}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets({ month, year }) });
      setIsOptionsOpen(false);
      setSelectedBudget(null);
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const budgets = data?.data || [];

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const handleOptions = (budget: any) => {
    setSelectedBudget(budget);
    setIsOptionsOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedBudget) return;
    Alert.alert(
      t('deleteBudget'),
      'Apakah Anda yakin ingin menghapus anggaran ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(selectedBudget.id) },
      ]
    );
  };

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-16 pb-4 bg-theme-bg border-b border-theme-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('monthlyBudget')}</Text>
        </View>
        <TouchableOpacity 
          className="bg-black p-2 rounded-full"
          onPress={() => router.push('/budgets/add')}
        >
          <Plus color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-theme-bg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Month Selector can be added here */}
        
        {budgets.map((budget: any) => {
          const progressPercentage = Math.min(Math.round((budget.spent / budget.amount) * 100) || 0, 100);
          const isOverbudget = budget.spent > budget.amount;

          return (
            <TouchableOpacity key={budget.id} onPress={() => handleOptions(budget)}>
              <Card className="mb-4 bg-theme-card border border-theme-border rounded-[24px] p-5 shadow-none">
                <Text className="font-bold text-gray-900 text-lg mb-1">{budget.category.name}</Text>
                
                <View className="flex-row justify-between mb-2 mt-4">
                  <AmountText amount={budget.spent} showSign={false} className={`font-bold text-lg ${isOverbudget ? 'text-red-600' : 'text-gray-900'}`} />
                  <Text className="text-gray-500 text-sm mt-1">/ <AmountText amount={budget.amount} showSign={false} className="text-gray-500 text-sm" /></Text>
                </View>

                {/* Progress Bar */}
                <View className="h-2 bg-gray-200 rounded-full w-full overflow-hidden mb-2 mt-1">
                  <View 
                    className={`h-full rounded-full ${isOverbudget ? 'bg-red-500' : 'bg-black'}`} 
                    style={{ width: `${progressPercentage}%` }} 
                  />
                </View>
                
                <View className="flex-row justify-between mt-1">
                  <Text className={`text-xs font-semibold ${isOverbudget ? 'text-red-500' : 'text-gray-900'}`}>
                    {progressPercentage}% Terpakai {isOverbudget ? '(Overbudget)' : ''}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        
        {budgets.length === 0 && !isLoading && (
          <EmptyState 
            title={t("noBudgets")} 
            actionLabel="Buat Anggaran" 
            onAction={() => router.push('/budgets/add')} 
          />
        )}

        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={200}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{selectedBudget?.category?.name}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-theme-border flex-row items-center"
            onPress={confirmDelete}
          >
            <Trash2 color="#ef4444" size={20} />
            <Text className="text-base text-red-500 ml-3">{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </Screen>
  );
}
