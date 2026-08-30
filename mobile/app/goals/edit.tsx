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
import { getLocalizedError } from '../../lib/api/errors';
import { EmptyState } from '../../components/ui/empty-state';
import { DatePickerInput } from '../../components/ui/date-picker-input';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['goal', id], // We don't have this key specifically mapped in queryKeys, but it's fine for simple GET
    queryFn: async () => {
      // In this system GET /api/v1/goals/[id] doesn't exist, we usually filter from goals array
      // But wait, the API does have GET /api/v1/goals/[id].
      const response = await apiClient.get(`/goals/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (data?.data) {
      const goal = data.data;
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      if (goal.deadline) {
        setTargetDate(new Date(goal.deadline));
      }
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/goals/${id}`, {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: targetDate ? targetDate.toISOString() : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
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
      <View className="flex-1 justify-center items-center bg-theme-bg">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-theme-bg justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('cancel')} onAction={() => router.back()} />
      </View>
    );
  }

  const handleSave = () => {
    if (!name.trim() || !targetAmount) {
      Alert.alert(t('errorOccurred'), 'Nama dan Target Nominal wajib diisi.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-theme-bg">
      <View className="flex-row items-center p-4 border-b border-theme-border pt-16">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{t('editGoal')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Input 
            label={t('goalName')}
            placeholder="Misal: Beli Mobil"
            value={name}
            onChangeText={setName}
          />

          <Input 
            label={t('targetAmount')}
            placeholder="0"
            keyboardType="numeric"
            value={targetAmount ? parseInt(targetAmount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setTargetAmount(text.replace(/[^0-9]/g, ''))}
          />

          <Input 
            label={t('currentAmount')}
            placeholder="0"
            keyboardType="numeric"
            value={currentAmount ? parseInt(currentAmount, 10).toLocaleString('id-ID') : ''}
            onChangeText={(text) => setCurrentAmount(text.replace(/[^0-9]/g, ''))}
          />

          <DatePickerInput 
            label={t('targetDateOptional')}
            value={targetDate}
            minimumDate={new Date()}
            onChange={setTargetDate as any}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !targetAmount}
              className="rounded-full"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
