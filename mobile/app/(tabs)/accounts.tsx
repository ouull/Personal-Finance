import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, Bell, Banknote, Building2, Wallet, TrendingUp } from 'lucide-react-native';
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

export default function AccountsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      return response.data;
    },
  });

  const { data: investmentsData, isLoading: isLoadingInvestments, refetch: refetchInvestments } = useQuery({
    queryKey: queryKeys.investments,
    queryFn: async () => {
      const response = await apiClient.get('/investments');
      return response.data;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setIsOptionsOpen(false);
      setSelectedAccount(null);
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleRefresh = () => {
    refetchAccounts();
    refetchInvestments();
  };

  const accounts = accountsData?.data || [];
  const investments = investmentsData?.data?.items || [];
  
  const cashAccounts = accounts.filter((a: any) => a.type === 'CASH');
  const bankAccounts = accounts.filter((a: any) => a.type === 'BANK');
  const ewalletAccounts = accounts.filter((a: any) => a.type === 'EWALLET');

  const cashTotal = cashAccounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
  const bankTotal = bankAccounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
  const ewalletTotal = ewalletAccounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
  const investmentsTotal = investments.reduce((acc: number, curr: any) => acc + Number(curr.currentValue), 0);
  
  const totalBalance = cashTotal + bankTotal + ewalletTotal + investmentsTotal;
  const isLoading = isLoadingAccounts || isLoadingInvestments;

  const handleOptions = (account: any) => {
    setSelectedAccount(account);
    setIsOptionsOpen(true);
  };

  const handleDelete = () => {
    if (!selectedAccount) return;
    if (selectedAccount.type === 'CASH') {
      Alert.alert('Error', getLocalizedError('SYSTEM_ACCOUNT_DELETION_FORBIDDEN', language as any));
      return;
    }

    Alert.alert(t('delete'), t('confirmDeleteAccount'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(selectedAccount.id) }
    ]);
  };

  if (isErrorAccounts) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={handleRefresh} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <View className="flex-1 bg-[#FDF8EB]">
        <ScrollView
          className="flex-1 px-4 pt-14 pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <View className="w-10 h-10 rounded-full bg-gray-300 mr-4 overflow-hidden">
                  <Image source={{ uri: profileData?.data?.user?.image || user?.image || 'https://i.pravatar.cc/150?img=68' }} className="flex-1" />
                </View>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900">{t('accounts')}</Text>
            </View>
            <Bell size={24} color="#111827" />
          </View>

          {/* Total Saldo Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card className="mb-8 bg-white rounded-[24px] p-6 border border-[#E5E0D5] shadow-sm">
              <Text className="text-gray-500 font-medium mb-1 text-sm">{t('totalBalance')}</Text>
              <AmountText
                amount={totalBalance}
                className="text-4xl font-extrabold tracking-tight text-black"
                showSign={false}
              />
            </Card>
          </Animated.View>

          {/* Cash Group */}
          {cashAccounts.length > 0 && (
            <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-6">
              <View className="flex-row justify-between items-end mb-3 px-1">
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-lg font-bold text-gray-900">{t('cash')}</Text>
                  <AmountText amount={cashTotal} className="text-gray-400 font-medium text-sm" showSign={false} />
                </View>
                <TouchableOpacity onPress={() => router.push('/accounts/add' as any)}><Plus size={18} color="#111827" /></TouchableOpacity>
              </View>
              <Card className="p-0 rounded-[24px] bg-white border border-[#E5E0D5] shadow-sm overflow-hidden">
                {cashAccounts.map((account: any, index: number) => (
                  <TouchableOpacity key={account.id} onPress={() => handleOptions(account)} className={`flex-row justify-between items-center p-4 ${index !== cashAccounts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="w-10 h-10 rounded-full bg-[#FDF8EB] items-center justify-center mr-4 border border-[#E5E0D5]">
                      <Banknote color="#4b5563" size={18} />
                    </View>
                    <View className="flex-1 mr-2 justify-center">
                      <Text className="font-bold text-gray-900 text-base mb-0.5">{account.name}</Text>
                      <Text className="text-sm font-medium text-gray-500">{t('physical')}</Text>
                    </View>
                    <AmountText amount={account.balance} className="font-medium text-base text-gray-900" showSign={false} />
                  </TouchableOpacity>
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Bank Group */}
          {(bankAccounts.length > 0 || cashAccounts.length === 0) && (
            <Animated.View entering={FadeInUp.delay(200).springify()} className="mb-6">
              <View className="flex-row justify-between items-end mb-3 px-1">
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-lg font-bold text-gray-900">{t('bank')}</Text>
                  <AmountText amount={bankTotal} className="text-gray-400 font-medium text-sm" showSign={false} />
                </View>
                <TouchableOpacity onPress={() => router.push('/accounts/add' as any)}><Plus size={18} color="#111827" /></TouchableOpacity>
              </View>
              <Card className="p-0 rounded-[24px] bg-white border border-[#E5E0D5] shadow-sm overflow-hidden">
                {bankAccounts.length > 0 ? bankAccounts.map((account: any, index: number) => (
                  <TouchableOpacity key={account.id} onPress={() => handleOptions(account)} className={`flex-row justify-between items-center p-4 ${index !== bankAccounts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="w-10 h-10 rounded-full bg-[#FDF8EB] items-center justify-center mr-4 border border-[#E5E0D5]">
                      <Building2 color="#4b5563" size={18} />
                    </View>
                    <View className="flex-1 mr-2 justify-center">
                      <Text className="font-bold text-gray-900 text-base mb-0.5">{account.name}</Text>
                      <Text className="text-sm font-medium text-gray-500">{account.status === 'ACTIVE' ? 'Active' : account.status}</Text>
                    </View>
                    <AmountText amount={account.balance} className="font-medium text-base text-gray-900" showSign={false} />
                  </TouchableOpacity>
                )) : (
                  <View className="p-4 items-center">
                     <Text className="text-gray-400 italic text-sm">{t('noBankAccounts')}</Text>
                  </View>
                )}
              </Card>
            </Animated.View>
          )}

          {/* E-Wallets Group */}
          {ewalletAccounts.length > 0 && (
            <Animated.View entering={FadeInUp.delay(250).springify()} className="mb-6">
              <View className="flex-row justify-between items-end mb-3 px-1">
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-lg font-bold text-gray-900">E-Wallets</Text>
                  <AmountText amount={ewalletTotal} className="text-gray-400 font-medium text-sm" showSign={false} />
                </View>
                <TouchableOpacity onPress={() => router.push('/accounts/add' as any)}><Plus size={18} color="#111827" /></TouchableOpacity>
              </View>
              <Card className="p-0 rounded-[24px] bg-white border border-[#E5E0D5] shadow-sm overflow-hidden">
                {ewalletAccounts.map((account: any, index: number) => (
                  <TouchableOpacity key={account.id} onPress={() => handleOptions(account)} className={`flex-row justify-between items-center p-4 ${index !== ewalletAccounts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <View className="w-10 h-10 rounded-full bg-[#FDF8EB] items-center justify-center mr-4 border border-[#E5E0D5]">
                      <Wallet color="#4b5563" size={18} />
                    </View>
                    <View className="flex-1 mr-2 justify-center">
                      <Text className="font-bold text-gray-900 text-base mb-0.5">{account.name}</Text>
                      <Text className="text-sm font-medium text-gray-500">{t('digital')}</Text>
                    </View>
                    <AmountText amount={account.balance} className="font-medium text-base text-gray-900" showSign={false} />
                  </TouchableOpacity>
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Investments Group */}
          {investments.length > 0 && (
            <Animated.View entering={FadeInUp.delay(300).springify()} className="mb-6">
              <View className="flex-row justify-between items-end mb-3 px-1">
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-lg font-bold text-gray-900">{t('investments')}</Text>
                  <AmountText amount={investmentsTotal} className="text-gray-400 font-medium text-sm" showSign={false} />
                </View>
                <TouchableOpacity onPress={() => router.push('/investments/add' as any)}><Plus size={18} color="#111827" /></TouchableOpacity>
              </View>
              <Card className="p-0 rounded-[24px] bg-white border border-[#E5E0D5] shadow-sm overflow-hidden">
                {investments.map((inv: any, index: number) => {
                  const invPct = inv.totalInvested ? (inv.unrealizedGain / inv.totalInvested) * 100 : 0;
                  const invPctStr = `${invPct >= 0 ? '↑' : '↓'} ${Math.abs(invPct).toFixed(1)}%`;
                  
                  return (
                    <TouchableOpacity key={inv.id} onPress={() => router.push(`/investments/${inv.id}` as any)} className={`flex-row justify-between items-center p-4 ${index !== investments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <View className="w-10 h-10 rounded-full bg-[#FDF8EB] items-center justify-center mr-4 border border-[#E5E0D5]">
                        <TrendingUp color="#4b5563" size={18} />
                      </View>
                      <View className="flex-1 mr-2 justify-center">
                        <Text className="font-bold text-gray-900 text-base mb-0.5">{inv.name}</Text>
                        <Text className="text-sm font-medium text-gray-500">{t('brokerage')}</Text>
                      </View>
                      <View className="items-end">
                        <AmountText amount={inv.currentValue} className="font-medium text-base text-gray-900" showSign={false} />
                        <Text className={`text-[11px] font-medium mt-0.5 ${invPct >= 0 ? 'text-gray-500' : 'text-red-500'}`}>{invPctStr}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </Animated.View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={260}>
        {selectedAccount && (
          <View className="px-6 pb-6 pt-0">
            <Text className="text-xl font-bold text-gray-900 mb-0">{selectedAccount.name}</Text>
            <AmountText amount={selectedAccount.balance} className="text-gray-500 mb-4" />
            
            <TouchableOpacity 
              className="py-4 border-b border-gray-100 flex-row items-center"
              onPress={() => {
                setIsOptionsOpen(false);
                router.push(`/accounts/add-cash?id=${selectedAccount.id}`);
              }}
            >
              <Text className="text-lg text-blue-600 font-medium">{t('addCashBalance')}</Text>
            </TouchableOpacity>
            
            {selectedAccount.type !== 'CASH' && (
              <TouchableOpacity 
                className="py-4 border-b border-gray-100 flex-row items-center"
                onPress={() => {
                  setIsOptionsOpen(false);
                  router.push(`/accounts/edit?id=${selectedAccount.id}`);
                }}
              >
                <Text className="text-lg text-gray-900 font-medium">{t('edit')}</Text>
              </TouchableOpacity>
            )}
            
            {selectedAccount.type !== 'CASH' && (
              <TouchableOpacity 
                className="py-4 flex-row items-center"
                onPress={handleDelete}
              >
                <Text className="text-lg text-red-600 font-medium">{t('delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
