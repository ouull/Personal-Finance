import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Settings, LogOut, ChevronRight, Target, Repeat, Bell, Shield, Wallet, Globe } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { BottomSheet } from '../../components/ui/bottom-sheet';

const MenuItem = ({ icon: Icon, title, onPress }: any) => (
  <TouchableOpacity 
    className="flex-row items-center justify-between py-4 border-b border-gray-100"
    onPress={onPress}
  >
    <View className="flex-row items-center">
      <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
        <Icon size={18} color="#2563eb" />
      </View>
      <Text className="text-gray-900 font-medium text-base">{title}</Text>
    </View>
    <ChevronRight size={20} color="#9ca3af" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const setLanguage = useAuthStore((state) => state.setLanguage);
  const queryClient = useQueryClient();

  const [isLangSheetOpen, setIsLangSheetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
  });

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: t('logout'), 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            queryClient.clear();
            router.replace('/(auth)/login');
          } 
        },
      ]
    );
  };

  const user = data?.data;

  return (
    <Screen safeArea={false}>
      <View className="px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          
          <Card className="mb-6 flex-row items-center">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
              <Text className="text-2xl text-blue-700 font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">{user?.name || 'Loading...'}</Text>
              <Text className="text-gray-500">{user?.email}</Text>
            </View>
          </Card>

          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Menu Keuangan</Text>
          <Card className="mb-6">
            <MenuItem 
              icon={Wallet} 
              title={t('lending')} 
              onPress={() => router.push('/lending')} 
            />
            <MenuItem 
              icon={Target} 
              title={t('goals')} 
              onPress={() => router.push('/goals')} 
            />
            <MenuItem 
              icon={Repeat} 
              title={t('recurring')} 
              onPress={() => router.push('/recurring')} 
            />
            <MenuItem 
              icon={Bell} 
              title={t('notifications')} 
              onPress={() => router.push('/notifications')} 
            />
          </Card>

          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Pengaturan</Text>
          <Card className="mb-6">
            <MenuItem 
              icon={Shield} 
              title={t('changePassword')} 
              onPress={() => router.push('/profile/change-password')} 
            />
            <TouchableOpacity 
              className="flex-row items-center justify-between py-4"
              onPress={() => setIsLangSheetOpen(true)}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                  <Globe size={18} color="#2563eb" />
                </View>
                <Text className="text-gray-900 font-medium text-base">{t('language')}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-500 mr-2">{language === 'id' ? 'Indonesia' : 'English'}</Text>
                <ChevronRight size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </Card>

          <TouchableOpacity 
            className="flex-row items-center justify-center py-4 bg-white rounded-2xl mb-8"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" className="mr-2" />
            <Text className="text-red-500 font-bold text-base">{t('logout')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>

      <BottomSheet visible={isLangSheetOpen} onClose={() => setIsLangSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('language')}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row justify-between items-center"
            onPress={() => { setLanguage('id'); setIsLangSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">Bahasa Indonesia</Text>
            {language === 'id' && <Text className="text-blue-600 font-bold">✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row justify-between items-center"
            onPress={() => { setLanguage('en'); setIsLangSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">English</Text>
            {language === 'en' && <Text className="text-blue-600 font-bold">✓</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>

    </Screen>
  );
}
