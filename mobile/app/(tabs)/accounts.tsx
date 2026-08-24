import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Plus, MoreVertical } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function AccountsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      return response.data;
    },
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

  const accounts = data?.data || [];
  const cashAccounts = accounts.filter((a: any) => a.type === 'CASH');
  const bankAccounts = accounts.filter((a: any) => a.type === 'BANK');
  const ewalletAccounts = accounts.filter((a: any) => a.type === 'EWALLET');

  const totalBalance = accounts.reduce((acc: number, curr: any) => acc + curr.balance, 0);

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

    Alert.alert(
      t('delete'),
      t('confirmDeleteAccount'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteMutation.mutate(selectedAccount.id) }
      ]
    );
  };

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const renderAccountList = (list: any[], title: string) => {
    if (list.length === 0) return null;
    return (
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-500 mb-3 ml-1 uppercase">{title}</Text>
        {list.map((account) => (
          <TouchableOpacity key={account.id} onPress={() => handleOptions(account)}>
            <Card className="mb-3 flex-row justify-between items-center">
              <View>
                <Text className="font-semibold text-gray-900 text-lg">{account.name}</Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {account.type} • {account.status}
                </Text>
              </View>
              <View className="flex-row items-center">
                <AmountText amount={account.balance} className="font-bold text-lg mr-2" />
                <MoreVertical size={20} color="#9ca3af" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Screen safeArea={false}>
      <ScrollView
        className="flex-1 px-4 pt-12 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <SectionHeader 
          title={t('accounts')} 
          action={
            <TouchableOpacity 
              className="bg-blue-100 p-2 rounded-full"
              onPress={() => router.push('/accounts/add')}
            >
              <Plus color="#2563eb" size={20} />
            </TouchableOpacity>
          } 
        />

        <Card className="mb-8 mt-4 bg-gray-900 border-0">
          <Text className="text-gray-400 font-medium mb-1">Total Saldo</Text>
          <AmountText amount={totalBalance} className="text-white text-3xl font-bold" showSign={false} />
        </Card>

        {renderAccountList(cashAccounts, 'Cash')}
        {renderAccountList(bankAccounts, 'Bank')}
        {renderAccountList(ewalletAccounts, 'E-Wallet')}
        
        {accounts.length === 0 && !isLoading && (
          <EmptyState title={t('noAccounts')} actionLabel={t('addAccount')} onAction={() => router.push('/accounts/add')} />
        )}
        
        <View className="h-10" />
      </ScrollView>

      <BottomSheet visible={isOptionsOpen} onClose={() => setIsOptionsOpen(false)} height={280}>
        {selectedAccount && (
          <View className="p-6">
            <Text className="text-xl font-bold text-gray-900 mb-1">{selectedAccount.name}</Text>
            <AmountText amount={selectedAccount.balance} className="text-gray-500 mb-6" />
            
            {selectedAccount.type === 'CASH' ? (
              <TouchableOpacity 
                className="py-4 border-b border-gray-100 flex-row items-center"
                onPress={() => {
                  setIsOptionsOpen(false);
                  router.push(`/accounts/add-cash?id=${selectedAccount.id}`);
                }}
              >
                <Text className="text-lg text-blue-600 font-medium">{t('addCashBalance')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  className="py-4 border-b border-gray-100 flex-row items-center"
                  onPress={() => {
                    setIsOptionsOpen(false);
                    router.push(`/accounts/edit?id=${selectedAccount.id}`);
                  }}
                >
                  <Text className="text-lg text-gray-900 font-medium">{t('edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="py-4 flex-row items-center"
                  onPress={handleDelete}
                >
                  <Text className="text-lg text-red-600 font-medium">{t('delete')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}
