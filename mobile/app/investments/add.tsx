import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddInvestmentScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState('');
  const [type, setType] = useState('STOCK');
  const [initialAmount, setInitialAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  // Fetch accounts to link initial amount
  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const response = await apiClient.get('/accounts');
      return response.data;
    }
  });

  const accounts = accountsData?.data || [];
  const selectedAccountName = accounts.find((a: any) => a.id === accountId)?.name || 'Pilih Akun...';

  // Format number with dots
  const formatNumber = (numStr: string) => {
    const cleanNum = numStr.replace(/\D/g, '');
    if (!cleanNum) return '';
    return parseInt(cleanNum, 10).toLocaleString('id-ID');
  };

  const handleAmountChange = (text: string) => {
    setInitialAmount(formatNumber(text));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const rawAmount = initialAmount ? parseFloat(initialAmount.replace(/\./g, '')) : 0;
      return apiClient.post('/investments', {
        name,
        type,
        platform,
        initialAmount: rawAmount,
        accountId: accountId || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      const details = error.response?.data?.details || {};
      const firstError = (Object.values(details)[0] as any)?._errors?.[0] || '';
      Alert.alert(t('errorOccurred'), `${getLocalizedError(code, language as any)} ${firstError}`);
    }
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('errorOccurred'), 'Nama investasi harus diisi.');
      return;
    }
    if (!accountId && initialAmount && parseFloat(initialAmount) > 0) {
      Alert.alert(t('errorOccurred'), t('selectSourceAccountRequired'));
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-16">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('addInvestment')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label={t("portfolioName")}
            placeholder={t("portfolioExample")}
            value={name}
            onChangeText={setName}
          />
          
          <Input 
            label="Platform / Sekuritas (Opsional)"
            placeholder="Misal: Ajaib, Bibit"
            value={platform}
            onChangeText={setPlatform}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('investmentType')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsTypeSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{t(`invType${type}` as any) || type}</Text>
            </TouchableOpacity>
          </View>

          <Input 
            label="Deposito"
            placeholder="0"
            keyboardType="numeric"
            value={initialAmount}
            onChangeText={handleAmountChange}
          />
          
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('depositSource')}</Text>
            <TouchableOpacity 
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{selectedAccountName}</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-4 mb-10">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim()} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isTypeSheetOpen} onClose={() => setIsTypeSheetOpen(false)} height={450}>
        <View className="p-4" style={{ flex: 1 }}>
          <Text className="text-lg font-bold mb-4">{t('selectTypeTitle')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {['STOCK', 'MUTUAL_FUND', 'BOND', 'CRYPTO', 'GOLD', 'OTHER'].map((typ) => (
              <TouchableOpacity 
                key={typ}
                style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                onPress={() => { setType(typ); setIsTypeSheetOpen(false); }}
              >
                <Text className="text-base text-gray-900">{t(`invType${typ}` as any) || typ}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
      
      <BottomSheet visible={isAccountSheetOpen} onClose={() => setIsAccountSheetOpen(false)} height={400}>
        <View className="p-4" style={{ flex: 1 }}>
          <Text className="text-lg font-bold mb-4">{t('selectSourceAccountTitle')}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {accounts.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                onPress={() => { setAccountId(a.id); setIsAccountSheetOpen(false); }}
              >
                <Text className="text-base font-medium text-gray-900">{a.name}</Text>
                <Text className="text-sm font-medium text-gray-500">Rp {Number(a.balance || 0).toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
