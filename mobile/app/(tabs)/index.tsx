import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { useAuthStore } from '../../stores/auth-store';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ArrowDown, ArrowUp, Receipt, Coffee, HomeIcon, Banknote, Bell, Plus, Briefcase, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await apiClient.get('/dashboard');
      return response.data;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    }
  });

  const dashboardData = data?.data;

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  // Calculate goal progress for the Goals card
  const goalsProgress = dashboardData?.totalGoalTarget > 0 
    ? (dashboardData.totalSavedForGoals / dashboardData.totalGoalTarget) * 100 
    : 0;

  const { user } = useAuthStore();
  const hour = new Date().getHours();
  let greetingKey: any = 'goodMorning';
  if (hour >= 4 && hour < 11) greetingKey = 'goodMorning';
  else if (hour >= 11 && hour < 15) greetingKey = 'goodAfternoon';
  else if (hour >= 15 && hour < 18) greetingKey = 'goodLateAfternoon';
  else greetingKey = 'goodEvening';

  return (
    <Screen safeArea={false}>
      <View className="flex-1 bg-[#E4DFC7]">
        <ScrollView
          className="flex-1 px-4 pt-14 pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <View className="w-10 h-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                  <Image source={{ uri: profileData?.data?.user?.image || user?.image || 'https://i.pravatar.cc/150?img=68' }} className="flex-1" />
                </View>
              </TouchableOpacity>
              <View>
                <Text className="text-sm text-gray-700 font-medium">{t('welcomeBack')}</Text>
              </View>
            </View>
            <Bell size={24} color="#111827" />
          </View>

          <Text className="text-2xl font-bold mb-4 text-gray-900">
            {t(greetingKey)}, {user?.name || dashboardData?.user?.name || 'User'}
          </Text>

          {/* Hero Section: Kekayaan Bersih */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card className="mb-4 bg-white rounded-[24px] p-6 border-0 shadow-sm">
              <Text className="text-gray-500 font-medium mb-1 text-sm">{t('netWorth')}</Text>
              <AmountText
                amount={dashboardData?.netWorth || 0}
                className="text-4xl font-extrabold tracking-tight text-black"
                showSign={false}
              />
            </Card>
          </Animated.View>

          {/* Financial Summary: Income / Expense */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="flex-row justify-between mb-4 gap-4">
            <Card className="flex-1 p-5 rounded-[24px] bg-white border-0 shadow-sm">
              <View className="flex-row items-center mb-2">
                <ArrowDown size={18} color="#4b5563" />
                <Text className="text-sm text-gray-600 ml-1">{t('monthlyIncome')}</Text>
              </View>
              <AmountText 
                amount={dashboardData?.monthlyIncome || 0} 
                className="text-gray-900 font-bold text-xl" 
                showSign={false} 
                numberOfLines={1} 
                adjustsFontSizeToFit 
              />
            </Card>
            <Card className="flex-1 p-5 rounded-[24px] bg-white border-0 shadow-sm">
              <View className="flex-row items-center mb-2">
                <ArrowUp size={18} color="#ef4444" />
                <Text className="text-sm text-gray-600 ml-1">{t('monthlyExpense')}</Text>
              </View>
              <AmountText 
                amount={dashboardData?.monthlyExpense || 0} 
                type="EXPENSE" 
                className="text-red-600 font-bold text-xl" 
                showSign={false} 
                numberOfLines={1} 
                adjustsFontSizeToFit 
              />
            </Card>
          </Animated.View>

          {/* Top Spending */}
          {dashboardData?.topSpendingCategory && dashboardData.topSpendingCategory.value > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card className="mb-8 rounded-[24px] p-5 flex-row justify-between items-center bg-white border-0 shadow-sm">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <ArrowUp size={18} color="#ef4444" />
                    <Text className="text-sm text-gray-600 ml-1">{t('topSpending')}</Text>
                  </View>
                  <AmountText 
                    amount={dashboardData.topSpendingCategory.value} 
                    type="EXPENSE" 
                    className="text-gray-900 font-bold text-xl" 
                    showSign={false} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit 
                  />
                </View>
                <Text className="font-bold text-gray-700 text-lg flex-shrink-0">{dashboardData.topSpendingCategory.name}</Text>
              </Card>
            </Animated.View>
          )}

          {/* Recent Transactions */}
          <Animated.View entering={FadeInUp.delay(300).springify()}>
            <View className="flex-row justify-between items-center mb-4 px-2">
              <Text className="text-base font-bold text-gray-900">{t('recentTransactions')}</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Text className="text-sm font-bold text-gray-900">{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <Card className="mb-8 p-0 rounded-[24px] bg-white border-0 shadow-sm overflow-hidden">
              {dashboardData?.recentTransactions?.length > 0 ? (
                dashboardData.recentTransactions.slice(0, 3).map((tx: any, index: number) => {
                  let title = tx.type;
                  const catName = tx.category?.slug ? (t(tx.category.slug as any) !== tx.category.slug ? t(tx.category.slug as any) : tx.category?.name) : tx.category?.name;
                  
                  if (tx.type === 'INITIAL_BALANCE') title = t('initialBalance') || 'Saldo Awal';
                  else if (tx.type === 'INCOME') title = catName || t('income');
                  else if (tx.type === 'EXPENSE') title = catName || t('expense');
                  else if (tx.type === 'TRANSFER') title = t('transfer');
                  
                  let subtitle = '';
                  if (tx.type === 'EXPENSE' || tx.type === 'INCOME') {
                    subtitle = catName || t('uncategorized') || 'Uncategorized';
                  } else if (tx.type === 'TRANSFER') {
                    subtitle = t('internal') || 'Internal';
                  }
                  
                  // Try to override with merchant, description, or notes
                  let merchantStr = tx.merchant?.name || tx.description || tx.notes;
                  if (merchantStr) {
                    if (typeof merchantStr === 'string') {
                      merchantStr = merchantStr.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '');
                      const diIndex = merchantStr.lastIndexOf(' di ');
                      if (diIndex !== -1) {
                        merchantStr = merchantStr.substring(0, diIndex);
                      }
                    }
                    title = merchantStr;
                  }
                  
                  const txDate = new Date(tx.date);
                  const today = new Date();
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);
                  
                  let dateStr = '';
                  const todayStr = t('today' as any) || 'Today';
                  const yesterdayStr = t('yesterday' as any) || 'Yesterday';
                  
                  const locale = language === 'id' ? 'id-ID' : 'en-US';
                  if (txDate.toDateString() === today.toDateString()) {
                    dateStr = todayStr + ', ' + txDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                  } else if (txDate.toDateString() === yesterday.toDateString()) {
                    dateStr = yesterdayStr + ', ' + txDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                  } else {
                    dateStr = txDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) + ', ' + txDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
                  }
                  
                  let IconComponent = Receipt;
                  if (title.toLowerCase().includes('kopi') || title.toLowerCase().includes('makanan') || title.toLowerCase().includes('makan')) IconComponent = Coffee;
                  if (title.toLowerCase().includes('rent') || title.toLowerCase().includes('sewa')) IconComponent = HomeIcon;
                  if (title.toLowerCase().includes('salary') || title.toLowerCase().includes('gaji')) IconComponent = Banknote;
                  
                  return (
                    <View key={tx.id} className={`flex-row justify-between items-center py-4 px-5 ${index !== Math.min(dashboardData.recentTransactions.length, 3) - 1 ? 'border-b border-gray-100' : ''}`}>
                      <View className="w-12 h-12 rounded-full bg-[#EAE5D9] items-center justify-center mr-4">
                        <IconComponent color="#4b5563" size={20} />
                      </View>
                      <View className="flex-1 mr-2 justify-center">
                        <Text className="font-bold text-gray-900 mb-0.5 text-base" numberOfLines={1}>{title}</Text>
                        {!!subtitle && <Text className="text-sm font-medium text-gray-700 mb-0.5" numberOfLines={1}>{subtitle}</Text>}
                        <Text className="text-[11px] font-medium text-gray-500">{dateStr}</Text>
                      </View>
                      <AmountText amount={tx.amount} type={tx.type} className="font-medium text-[15px]" />
                    </View>
                  );
                })
              ) : (
                <Text className="text-gray-500 italic py-6 text-center">{t('noTransactions')}</Text>
              )}
            </Card>
          </Animated.View>

          {/* Goals Card */}
          <Animated.View entering={FadeInUp.delay(400).springify()}>
            <Card className="mb-10 bg-white rounded-[24px] p-6 border-0 shadow-sm">
              <Text className="text-gray-500 font-medium mb-1 text-sm">{t('totalSavedForGoals')}</Text>
              <AmountText
                amount={dashboardData?.totalSavedForGoals || 0}
                className="text-3xl font-extrabold tracking-tight text-black mb-8"
                showSign={false}
              />
              
              <View className="flex-row justify-between items-end mb-2">
                <View>
                  <Text className="text-gray-500 font-medium text-xs mb-1">{t('totalGoalTarget')}</Text>
                  <AmountText amount={dashboardData?.totalGoalTarget || 0} className="font-bold text-gray-900 text-base" showSign={false} />
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-gray-500 font-bold text-[10px] tracking-wider mb-1">{t('overallProgress')}</Text>
                  <Text className="font-bold text-gray-900 text-base">{Math.round(goalsProgress)}%</Text>
                </View>
              </View>

              <View className="h-2 bg-gray-200 rounded-full w-full overflow-hidden mb-6">
                <View 
                  className="h-full bg-[#4A3B2C] rounded-full" 
                  style={{ width: `${Math.min(goalsProgress, 100)}%` }} 
                />
              </View>

              <TouchableOpacity onPress={() => router.push('/goals')} className="items-end">
                <Text className="font-bold text-gray-900 text-sm">{t('viewAll')}</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>

          <View className="h-20" />
        </ScrollView>
        
      </View>
    </Screen>
  );
}
