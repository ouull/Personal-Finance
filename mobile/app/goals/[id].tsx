import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Edit2, Trash2, ArrowUpCircle } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { Button } from '../../components/ui/button';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.goal(id as string),
    queryFn: async () => {
      const response = await apiClient.get(`/goals/${id}`);
      return response.data;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.isActive === true) || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const depositMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/goals/${id}/deposit`, {
        amount: parseFloat(depositAmount),
        accountId,
        notes: "Tabungan Tujuan Finansial",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goal(id as string) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setIsDepositOpen(false);
      setDepositAmount('');
      setAccountId('');
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  if (isLoading) {
    return (
      <Screen className="justify-center items-center bg-theme-bg">
        <ActivityIndicator size="large" color="#111827" />
      </Screen>
    );
  }

  if (isError || !data?.data) {
    return (
      <Screen className="justify-center bg-theme-bg">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const goal = data.data;
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const confirmDelete = () => {
    setIsOptionsOpen(false);
    Alert.alert(
      t('deleteGoal'),
      'Apakah Anda yakin ingin menghapus tujuan keuangan ini?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
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
          <Text className="text-xl font-bold text-gray-900">{goal.name}</Text>
        </View>
        <TouchableOpacity 
          className="bg-theme-input p-2 rounded-full"
          onPress={() => setIsOptionsOpen(true)}
        >
          <Edit2 color="#111827" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-6 bg-theme-bg"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Card className="mb-6 bg-theme-card border border-theme-border rounded-[24px] shadow-none items-center py-8">
          <Text className="text-gray-500 font-medium mb-2 uppercase tracking-wider">{t('collected')}</Text>
          <AmountText amount={goal.currentAmount} className="text-gray-900 text-5xl font-extrabold mb-6" showSign={false} />
          
          <View className="w-full px-6 mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs font-semibold text-gray-900">{progress.toFixed(1)}%</Text>
              <Text className="text-xs font-semibold text-gray-500">Target: <AmountText amount={goal.targetAmount} showSign={false} className="text-xs" /></Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full w-full overflow-hidden">
              <View 
                className="h-full bg-black rounded-full" 
                style={{ width: `${Math.min(progress, 100)}%` }} 
              />
            </View>
          </View>

          <View className="flex-row w-full justify-around border-t border-theme-border pt-6">
            <View className="items-center">
              <Text className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{t('remaining')}</Text>
              <AmountText amount={remaining} className="text-gray-900 font-bold" showSign={false} />
            </View>
            {goal.deadline && (
              <View className="items-center border-l border-theme-border pl-4 w-1/2">
                <Text className="text-gray-500 text-xs mb-1 uppercase tracking-wider">{t('deadline')}</Text>
                <Text className="text-gray-900 font-bold">
                  {new Date(goal.deadline).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {progress < 100 && (
          <Button 
            label={t('addDeposit')}
            className="mb-8 rounded-full" 
            onPress={() => setIsDepositOpen(true)} 
          />
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Options Bottom Sheet */}
      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={250}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{goal.name}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-theme-border flex-row items-center"
            onPress={() => {
              setIsOptionsOpen(false);
              router.push(`/goals/edit?id=${goal.id}`);
            }}
          >
            <Edit2 color="#111827" size={20} />
            <Text className="text-base text-gray-900 ml-3">{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-theme-border flex-row items-center"
            onPress={confirmDelete}
          >
            <Trash2 color="#ef4444" size={20} />
            <Text className="text-base text-red-500 ml-3">{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Deposit Bottom Sheet */}
      <BottomSheet visible={isDepositOpen} onClose={() => { setIsDepositOpen(false); setIsSelectingAccount(false); }} height={isSelectingAccount ? 500 : 420}>
        {isSelectingAccount ? (
          <View className="p-4 flex-1">
            <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  className="py-4 border-b border-theme-border flex-row justify-between items-center"
                  onPress={() => {
                    setAccountId(a.id);
                    setIsSelectingAccount(false);
                  }}
                >
                  <Text className="text-base text-gray-900 font-semibold">{a.name}</Text>
                  <Text className="text-sm font-medium text-gray-500">Rp {Number(a.balance || 0).toLocaleString('id-ID')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View className="flex-1 p-6">
            <Text className="text-xl font-bold mb-4">{t('addDeposit')}</Text>
            
            <Input 
              label={t('amount')}
              placeholder="0"
              keyboardType="numeric"
              value={depositAmount ? parseInt(depositAmount, 10).toLocaleString('id-ID') : ''}
              onChangeText={(text) => setDepositAmount(text.replace(/[^0-9]/g, ''))}
              autoFocus
            />

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">{t("sourceAccount")}</Text>
              <TouchableOpacity 
                className="border border-theme-border rounded-xl p-4 bg-theme-input flex-row justify-between items-center"
                onPress={() => setIsSelectingAccount(true)}
              >
                <Text className={selectedAccount ? 'text-gray-900 text-base font-medium' : 'text-gray-500 text-base'}>
                  {selectedAccount ? selectedAccount.name : t('selectAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row gap-4">
              <Button label={t('cancel')} variant="secondary" className="flex-1 rounded-full" onPress={() => setIsDepositOpen(false)} />
              <Button label="Deposit" className="flex-1 rounded-full" onPress={() => depositMutation.mutate()} isLoading={depositMutation.isPending} disabled={!depositAmount || !accountId} />
            </View>
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
