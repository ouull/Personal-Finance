/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { getLocalizedError } from '../../lib/api/errors';
import { EmptyState } from '../../components/ui/empty-state';
import { DatePickerInput } from '../../components/ui/date-picker-input';

export default function EditRecurringScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('MONTHLY');
  const [status, setStatus] = useState('ACTIVE');
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);

  const [isFreqSheetOpen, setIsFreqSheetOpen] = useState(false);
  const [isStatusSheetOpen, setIsStatusSheetOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['recurring', id],
    queryFn: async () => {
      const response = await apiClient.get(`/recurring/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (data?.data) {
      const rp = data.data;
      setName(rp.name);
      setAmount(rp.amount.toString());
      setBillingCycle(rp.billingCycle || 'MONTHLY');
      setStatus(rp.status);
      if (rp.nextDueDate) {
        setNextDueDate(new Date(rp.nextDueDate));
      }
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/recurring/${id}`, {
        name,
        amount: parseFloat(amount),
        billingCycle,
        status,
        nextDueDate: nextDueDate ? nextDueDate.toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      router.back();
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-white justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('cancel')} onAction={() => router.back()} />
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim() || !amount) {
      Alert.alert(t('errorOccurred'), 'Nama dan Nominal wajib diisi.');
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
        <Text className="text-xl font-bold text-gray-900">{t('editRecurring')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input
            label={t("subName")}
            placeholder="Misal: Netflix, Spotify Premium"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input
            label={t('amount')}
            placeholder="0"
            keyboardType="numeric"
            value={amount ? parseInt(amount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
          />

          <DatePickerInput
            label={t('nextDueDateLong')}
            value={nextDueDate}
            minimumDate={new Date()}
            onChange={setNextDueDate as any}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('frequency')} (Siklus Tagihan)</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsFreqSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{billingCycle}</Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{t('status')}</Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl p-4 bg-gray-50 flex-row justify-between items-center"
              onPress={() => setIsStatusSheetOpen(true)}
            >
              <Text className="text-gray-900 text-base">{status}</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <Button
              label={t('save')}
              onPress={handleSave}
              isLoading={mutation.isPending}
              disabled={!name.trim() || !amount}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={isFreqSheetOpen} onClose={() => setIsFreqSheetOpen(false)} height={320}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectFrequency')}</Text>
          {['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((freq) => (
            <TouchableOpacity
              key={freq}
              className="py-4 border-b border-gray-100"
              onPress={() => { setBillingCycle(freq); setIsFreqSheetOpen(false); }}
            >
              <Text className="text-base text-gray-900">{freq}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={isStatusSheetOpen} onClose={() => setIsStatusSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('selectStatus')}</Text>
          {['ACTIVE', 'PAUSED'].map((st) => (
            <TouchableOpacity
              key={st}
              className="py-4 border-b border-gray-100"
              onPress={() => { setStatus(st); setIsStatusSheetOpen(false); }}
            >
              <Text className="text-base text-gray-900">{st}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
