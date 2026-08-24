import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getLocalizedError } from '../../lib/api/errors';

export default function AddGoalScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  // Target date string YYYY-MM-DD
  const [targetDate, setTargetDate] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/goals', {
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
        <Text className="text-xl font-bold text-gray-900">{t('addGoal')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
          <Input 
            label={t('goalName')}
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
            label={`${t('currentAmount')} (Opsional)`}
            placeholder="0"
            keyboardType="numeric"
            value={currentAmount}
            onChangeText={setCurrentAmount}
          />

          <Input 
            label={t('targetDateOptional')}
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
