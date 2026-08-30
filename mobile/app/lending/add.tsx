import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Bell } from 'lucide-react-native';
import { Input } from '../../components/ui/input';
import { DatePickerInput } from '../../components/ui/date-picker-input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddLendingScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<'BORROWED' | 'LENT'>('BORROWED');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [lentDate, setLentDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const accounts = accountsData?.data?.filter((a: any) => a.isActive === true) || [];
  const selectedAccount = accounts.find((a: any) => a.id === accountId);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/lending', {
        type,
        borrowerName: name,
        amount: parseFloat(amount),
        accountId,
        lentDate: lentDate ? lentDate.toISOString() : new Date().toISOString(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lending });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const handleSave = () => {
    if (!name.trim() || !amount || !accountId) {
      Alert.alert(t('errorOccurred'), 'Semua field wajib diisi.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-[#FDF8EB]">
      <View className="flex-row items-center justify-between p-4 pt-16 bg-[#FDF8EB]">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('addDebtOrLoan')}</Text>
        <TouchableOpacity>
          <Bell size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      
      <View className="px-6 py-4 bg-[#FDF8EB]">
        <View className="flex-row bg-[#EAE5D9] rounded-full p-1 border border-[#D5D0C5]">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-full items-center ${type === 'BORROWED' ? 'bg-black' : 'bg-transparent'}`}
            onPress={() => setType('BORROWED')}
          >
            <Text className={`font-medium ${type === 'BORROWED' ? 'text-white' : 'text-gray-600'}`}>{t('iOwe')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-full items-center ${type === 'LENT' ? 'bg-black' : 'bg-transparent'}`}
            onPress={() => setType('LENT')}
          >
            <Text className={`font-medium ${type === 'LENT' ? 'text-white' : 'text-gray-600'}`}>{t('owedToMe')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label={t('personName')}
            placeholder={t('personNamePlaceholder')}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label={t('amount')}
            placeholder="Rp. 0.00"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('sourceAccountLabel')}</Text>
            <TouchableOpacity 
              className="border border-[#D5D0C5] rounded-xl p-4 bg-[#EAE5D9] flex-row justify-between items-center"
              onPress={() => setIsAccountSheetOpen(true)}
            >
              <Text className={selectedAccount ? 'text-gray-900 text-base' : 'text-gray-500 text-base'}>
                {selectedAccount ? selectedAccount.name : t('selectAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <DatePickerInput 
            label={t('dueDate')}
            value={dueDate}
            onChange={setDueDate as any}
            minimumDate={lentDate || new Date()}
          />
          
          <Input 
            label={t('notesLabel')}
            placeholder={t('addDetailsPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              className="rounded-full py-4"
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !amount || !accountId} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isAccountSheetOpen} onClose={() => setIsAccountSheetOpen(false)}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectAccount')}</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {accounts.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                className="py-4 border-b border-gray-100 flex-row justify-between items-center"
                onPress={() => {
                  setAccountId(a.id);
                  setIsAccountSheetOpen(false);
                }}
              >
                <Text className="text-base text-gray-900">{a.name}</Text>
                <Text className="text-sm font-medium text-gray-500">Rp {Number(a.balance || 0).toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}
