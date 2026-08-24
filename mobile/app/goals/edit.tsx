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

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams();
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

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
      if (goal.targetDate) {
        setTargetDate(new Date(goal.targetDate).toISOString().split('T')[0]);
      }
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.patch(`/goals/${id}`, {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
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
    if (!name.trim() || !targetAmount) {
      Alert.alert(t('errorOccurred'), 'Nama dan Target Nominal wajib diisi.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-100 pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Edit Tujuan</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label="Nama Tujuan"
            placeholder="Misal: Beli Mobil"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Input 
            label={t('targetAmount')}
            placeholder="0"
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />

          <Input 
            label="Terkumpul Saat Ini"
            placeholder="0"
            keyboardType="numeric"
            value={currentAmount}
            onChangeText={setCurrentAmount}
          />

          <Input 
            label="Tanggal Target (Opsional, YYYY-MM-DD)"
            placeholder="2027-12-31"
            value={targetDate}
            onChangeText={setTargetDate}
          />

          <View className="mt-8">
            <Button 
              label={t('save')} 
              onPress={handleSave} 
              isLoading={mutation.isPending} 
              disabled={!name.trim() || !targetAmount} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
