import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { EmptyState } from '../../components/ui/empty-state';
import { getLocalizedError } from '../../lib/api/errors';

export default function NotificationsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data;
    },
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post(`/notifications/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error: any) => {
      const code = error.response?.data?.error?.code || 'UNKNOWN';
      Alert.alert(t('errorOccurred'), getLocalizedError(code, language as any));
    }
  });

  const notifications = data?.data || [];

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <View className="flex-row justify-between items-center px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={28} color="#111827" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">{t('notifications')}</Text>
        </View>
        <TouchableOpacity onPress={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
          <CheckCircle color={readAllMutation.isPending ? '#9ca3af' : '#2563eb'} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {notifications.map((notif: any) => (
          <TouchableOpacity 
            key={notif.id} 
            className={`p-4 border-b border-gray-100 flex-row items-start ${notif.isRead ? 'bg-white' : 'bg-blue-50'}`}
            onPress={() => {
              if (!notif.isRead) {
                readMutation.mutate(notif.id);
              }
            }}
          >
            <View className="flex-1">
              <Text className={`text-base ${notif.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{notif.title}</Text>
              <Text className="text-sm text-gray-500 mt-1">{notif.message}</Text>
              <Text className="text-xs text-gray-400 mt-2">{new Date(notif.createdAt).toLocaleString()}</Text>
            </View>
            {!notif.isRead && (
              <View className="w-3 h-3 rounded-full bg-blue-600 mt-2 ml-2" />
            )}
          </TouchableOpacity>
        ))}
        
        {notifications.length === 0 && !isLoading && (
          <EmptyState title="Belum ada notifikasi." />
        )}
      </ScrollView>
    </Screen>
  );
}
