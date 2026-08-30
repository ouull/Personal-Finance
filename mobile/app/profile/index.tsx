import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { 
  ChevronRight,
  ChevronLeft,
  Flag, 
  Bell, 
  Lock, 
  Globe, 
  HelpCircle, 
  Info, 
  LogOut, 
  Pencil,
  BarChart3,
  Wallet,
  MonitorPlay
} from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';
import { Screen } from '../../components/ui/screen';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';

const MenuItem = ({ icon: Icon, title, onPress, rightContent, isLast = false }: any) => (
  <TouchableOpacity 
    className={`flex-row items-center justify-between py-4 px-4`}
    onPress={onPress}
  >
    <View className="flex-row items-center">
      <View className="w-10 h-10 rounded-full border border-gray-400/50 items-center justify-center mr-4 bg-[#E4DFC7]/50">
        <Icon size={20} color="#374151" strokeWidth={2} />
      </View>
      <Text className="text-gray-900 font-medium text-base">{title}</Text>
    </View>
    <View className="flex-row items-center">
      {rightContent}
      <ChevronRight size={20} color="#6b7280" />
    </View>
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

  const updateProfileMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const formattedImage = `data:image/jpeg;base64,${base64Image}`;
      return apiClient.patch('/profile', { image: formattedImage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
    },
    onError: () => {
      Alert.alert('Error', 'Gagal memperbarui foto profil');
    }
  });

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Izin Ditolak', 'Anda perlu memberikan akses ke galeri untuk mengubah foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      updateProfileMutation.mutate(result.assets[0].base64);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      'Apakah Anda yakin ingin keluar?',
      [
        { text: t('cancel'), style: 'cancel' },
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

  const user = data?.data?.user || { name: 'Alex Morgan', email: 'Alex@gmail.com' };

  return (
    <Screen safeArea={false}>
      <View className="flex-1 bg-[#E4DFC7]">
        <ScrollView className="flex-1 px-5 pt-16 pb-24" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="flex-row items-center justify-center mb-6 relative">
            <TouchableOpacity 
              className="absolute left-0 w-10 h-10 items-center justify-center z-10"
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">{t('profile')}</Text>
          </View>

          {/* Profile Picture */}
          <View className="items-center mb-2">
            <View className="relative">
              <View className="w-24 h-24 rounded-full border-[3px] border-[#d6d0b6] overflow-hidden bg-gray-300">
                <Image source={{ uri: user?.image || 'https://i.pravatar.cc/150?img=68' }} className="w-full h-full" />
              </View>
              <TouchableOpacity 
                className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full items-center justify-center border-2 border-[#E4DFC7]"
                onPress={handlePickImage}
                disabled={updateProfileMutation.isPending}
              >
                <Pencil size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name & Email */}
          <View className="items-center mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-2">{user?.name || 'Alex Morgan'}</Text>
            <View className="bg-[#4A3B2C] px-4 py-1 rounded-full">
              <Text className="text-white text-xs">{user?.email || 'Alex@gmail.com'}</Text>
            </View>
          </View>

          {/* Keuangan Section */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-600 mb-2 ml-1">{t('finance')}</Text>
            <View className="rounded-[16px] border border-black/10 bg-black/5 overflow-hidden">
              <MenuItem 
                icon={Wallet} 
                title={t("lending")}
                onPress={() => router.push('/lending')} 
              />
              <MenuItem 
                icon={Flag} 
                title={t("goals")}
                onPress={() => router.push('/goals')} 
              />
              <MenuItem 
                icon={MonitorPlay} 
                title={t("recurring")}
                onPress={() => router.push('/recurring')} 
              />
              <MenuItem 
                icon={Bell} 
                title={t("notifications")}
                onPress={() => router.push('/notifications')} 
              />
              <MenuItem 
                icon={BarChart3} 
                title={t("reports")}
                onPress={() => router.push('/reports')} 
                isLast
              />
            </View>
          </View>

          {/* Pengaturan Section */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-600 mb-2 ml-1">{t('settings')}</Text>
            <View className="rounded-[16px] border border-black/10 bg-black/5 overflow-hidden">
              <MenuItem 
                icon={Lock} 
                title={t("changePassword")}
                onPress={() => router.push('/profile/change-password')} 
              />
              <MenuItem 
                icon={Globe} 
                title={t("language")}
                onPress={() => setIsLangSheetOpen(true)} 
                rightContent={<Text className="text-gray-500 font-medium mr-2 text-sm">{language === 'id' ? 'ID' : 'EN'}</Text>}
                isLast
              />
            </View>
          </View>

          {/* Lainnya Section */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-600 mb-2 ml-1">{t('others')}</Text>
            <View className="rounded-[16px] border border-black/10 bg-black/5 overflow-hidden">
              <MenuItem 
                icon={HelpCircle} 
                title={t("helpCenter")}
                onPress={() => {}} 
              />
              <MenuItem 
                icon={Info} 
                title={t("aboutApp")}
                onPress={() => {}} 
                isLast
              />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity 
            className="flex-row items-center justify-center py-4 bg-black rounded-full mb-12"
            onPress={handleLogout}
          >
            <LogOut size={20} color="white" className="mr-3" />
            <Text className="text-white font-bold text-base">{t('logout')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      <BottomSheet visible={isLangSheetOpen} onClose={() => setIsLangSheetOpen(false)} height={220}>
        <View className="p-4">
          <Text className="text-lg font-bold mb-4">{t('language')}</Text>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row justify-between items-center"
            onPress={() => { setLanguage('id'); setIsLangSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('indonesian')}</Text>
            {language === 'id' && <Text className="text-blue-600 font-bold">✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity 
            className="py-4 border-b border-gray-100 flex-row justify-between items-center"
            onPress={() => { setLanguage('en'); setIsLangSheetOpen(false); }}
          >
            <Text className="text-base text-gray-900">{t('english')}</Text>
            {language === 'en' && <Text className="text-blue-600 font-bold">✓</Text>}
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </Screen>
  );
}
