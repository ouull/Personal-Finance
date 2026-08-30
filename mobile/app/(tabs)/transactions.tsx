import React, { useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Filter, ChevronDown, ChevronUp, Receipt, Search, Check, Coffee, HomeIcon, Banknote, Utensils, TrendingUp, Briefcase } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { Button } from '../../components/ui/button';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/auth-store';

const CATEGORY_GROUPS = [
  { id: 'food_and_beverage', name: 'Food & Beverage', slugs: ['food', 'beverage', 'coffee', 'restaurant', 'snack'] },
  { id: 'transportation', name: 'Transportation', slugs: ['fuel', 'online_transport', 'parking', 'toll', 'vehicle_service'] },
  { id: 'housing', name: 'Housing', slugs: ['rent', 'electricity', 'water', 'home_supplies'] },
  { id: 'shopping', name: 'Shopping', slugs: ['online_shopping', 'fashion', 'electronics', 'household'] },
  { id: 'entertainment', name: 'Entertainment', slugs: ['game', 'movie', 'entertainment'] },
  { id: 'digital_and_subscriptions', name: 'Digital & Subscriptions', slugs: ['phone_credit', 'mobile_data', 'internet', 'subscription'] },
  { id: 'personal', name: 'Personal Care', slugs: ['personal_care', 'cigarettes', 'vape'] },
  { id: 'health', name: 'Health', slugs: ['medicine', 'doctor', 'hospital'] },
  { id: 'education', name: 'Education', slugs: ['books', 'course'] },
  { id: 'financial', name: 'Financial', slugs: ['admin_fee', 'tax', 'transfer_fee'] },
];

export default function TransactionsScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    }
  });

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>('food_and_beverage');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories(typeFilter || undefined),
    queryFn: async () => {
      const url = typeFilter ? `/categories?type=${typeFilter}` : '/categories';
      const res = await apiClient.get(url);
      return res.data;
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const res = await apiClient.get('/accounts');
      return res.data;
    },
  });

  const categories = categoriesData?.data || [];
  const accounts = accountsData?.data || [];

  const groupedCategories: Record<string, { name: string, items: any[] }> = {};
  CATEGORY_GROUPS.forEach(group => {
    const cats = categories.filter((c: any) => c.slug && group.slugs.includes(c.slug));
    if (cats.length > 0) groupedCategories[group.id] = { name: group.name, items: cats };
  });

  const allGroupedSlugs = CATEGORY_GROUPS.flatMap(g => g.slugs);
  const customCategories = categories.filter((c: any) => !c.slug || !allGroupedSlugs.includes(c.slug));
  if (customCategories.length > 0) {
    groupedCategories['my_categories'] = { name: 'My Categories', items: customCategories };
  }

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.transactions({ type: typeFilter, categoryId: categoryFilter, accountId: accountFilter }),
    queryFn: async ({ pageParam = 1 }) => {
      const limit = 20;
      const offset = ((pageParam as number) - 1) * limit;
      let url = `/transactions?offset=${offset}&limit=${limit}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (Array.isArray(lastPage.data) && lastPage.data.length === 20) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const allFetchedTransactions = data?.pages.flatMap((page) => Array.isArray(page.data) ? page.data : []) || [];
  
  // Local Filtering for category and account
  const transactions = allFetchedTransactions.filter((tx: any) => {
    let matchesCategory = true;
    let matchesAccount = true;
    
    if (categoryFilter) {
      matchesCategory = tx.categoryId === categoryFilter;
    }
    
    if (accountFilter) {
      matchesAccount = tx.sourceAccountId === accountFilter || tx.destinationAccountId === accountFilter;
    }
    
    return matchesCategory && matchesAccount;
  });

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = new Date(tx.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey = '';
    const todayStr = t('today' as any) || 'Today';
    const yesterdayStr = t('yesterday' as any) || 'Yesterday';

    const locale = language === 'id' ? 'id-ID' : 'en-US';
    if (date.toDateString() === today.toDateString()) {
      dateKey = todayStr;
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = yesterdayStr;
    } else {
      dateKey = date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(tx);
    return groups;
  }, {} as Record<string, any[]>);

  const applyFilters = () => {
    setIsFilterSheetOpen(false);
    refetch();
  };

  const clearFilters = () => {
    setTypeFilter('');
    setCategoryFilter('');
    setAccountFilter('');
    setIsFilterSheetOpen(false);
  };

  const renderCheckbox = (checked: boolean) => (
    checked ? (
      <View className="w-5 h-5 bg-black rounded flex items-center justify-center">
        <Check color="white" size={14} />
      </View>
    ) : (
      <View className="w-5 h-5 border border-gray-300 rounded bg-white" />
    )
  );

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  return (
    <Screen safeArea={false}>
      <View className="flex-1 bg-[#FDF8EB]">
        <ScrollView
          className="flex-1 px-4 pt-14 pb-24"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          onScroll={(e) => {
            const paddingToBottom = 20;
            if (e.nativeEvent.layoutMeasurement.height + e.nativeEvent.contentOffset.y >= e.nativeEvent.contentSize.height - paddingToBottom) {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <View className="w-10 h-10 rounded-full bg-gray-300 mr-4 overflow-hidden">
                  <Image source={{ uri: profileData?.data?.user?.image || user?.image || 'https://i.pravatar.cc/150?img=68' }} className="flex-1" />
                </View>
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900">{t('transactions')}</Text>
            </View>
            <View className="flex-row gap-5 items-center">
              <TouchableOpacity>
                <Search color="#111827" size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsFilterSheetOpen(true)}>
                <Filter color="#111827" size={22} />
              </TouchableOpacity>
            </View>
          </View>

          {Object.entries(groupedTransactions).map(([dateKey, items]: [string, any], groupIndex) => (
            <Animated.View key={dateKey} entering={FadeInUp.delay(groupIndex * 100).springify()} className="mb-6">
              <Text className="text-gray-600 font-medium mb-3 ml-1">{dateKey}</Text>
              <Card className="p-0 rounded-[24px] bg-white border border-[#E5E0D5] shadow-sm overflow-hidden">
                {items.map((item: any, index: number) => {
                  let title = item.type;
                  const catName = item.category?.slug ? (t(item.category.slug as any) !== item.category.slug ? t(item.category.slug as any) : item.category?.name) : item.category?.name;
                  
                  if (item.type === 'INITIAL_BALANCE') title = t('initialBalance') || 'Saldo Awal';
                  else if (item.type === 'INCOME') title = catName || t('income');
                  else if (item.type === 'EXPENSE') title = catName || t('expense');
                  else if (item.type === 'TRANSFER') title = t('transfer');
                  
                  let subtitle = '';
                  if (item.type === 'EXPENSE' || item.type === 'INCOME') {
                    subtitle = catName || t('uncategorized') || 'Uncategorized';
                  } else if (item.type === 'TRANSFER') {
                    subtitle = t('internal') || 'Internal';
                  }
                  
                  // Try to override with merchant, description, or notes
                  let merchantStr = item.merchant?.name || item.description || item.notes;
                  if (merchantStr) {
                    merchantStr = merchantStr.replace('Beli aset ', '').replace('Jual aset ', '').replace('Tarik Dana dari ', '').replace('Deposit Dana ke ', '').replace('Jual Investasi: ', '').replace('Beli Investasi: ', '');
                    const diIndex = merchantStr.lastIndexOf(' di ');
                    if (diIndex !== -1) {
                      merchantStr = merchantStr.substring(0, diIndex);
                    }
                    title = merchantStr;
                  }

                  const txDate = new Date(item.date);
                  const timeStr = `${txDate.getHours().toString().padStart(2, '0')}:${txDate.getMinutes().toString().padStart(2, '0')}`;
                  const ampm = txDate.getHours() >= 12 ? 'PM' : 'AM';
                  const time12Str = `${(txDate.getHours() % 12) || 12}:${txDate.getMinutes().toString().padStart(2, '0')} ${ampm}`;
                  
                  const subText = subtitle ? `${subtitle} • ${time12Str}` : time12Str;

                  let IconComponent = Receipt;
                  if (title.toLowerCase().includes('kopi') || subtitle.toLowerCase().includes('food') || title.toLowerCase().includes('coffee') || title.toLowerCase().includes('market')) IconComponent = Utensils;
                  if (title.toLowerCase().includes('transfer')) IconComponent = TrendingUp;
                  if (title.toLowerCase().includes('salary') || title.toLowerCase().includes('payroll')) IconComponent = Banknote;
                  if (title.toLowerCase().includes('rent') || title.toLowerCase().includes('home')) IconComponent = HomeIcon;

                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      onPress={() => router.push(`/transactions/${item.id}` as any)}
                      className={`flex-row justify-between items-center py-4 px-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <View className="w-12 h-12 rounded-full bg-[#EAE5D9] items-center justify-center mr-4">
                        <IconComponent color="#4b5563" size={20} />
                      </View>
                      <View className="flex-1 mr-2 justify-center">
                        <Text className="font-bold text-gray-900 text-[15px] mb-0.5" numberOfLines={1}>
                          {title}
                        </Text>
                        <Text className="text-[13px] text-gray-500 font-medium">
                          {subText}
                        </Text>
                      </View>
                      <AmountText amount={item.amount} type={item.type} className="font-bold text-[15px]" />
                    </TouchableOpacity>
                  );
                })}
              </Card>
            </Animated.View>
          ))}

          {transactions.length === 0 && !isLoading && (
            <EmptyState title={t('noTransactions')} />
          )}
          {isFetchingNextPage && (
            <ActivityIndicator className="my-4" color="#000" />
          )}

          <View className="h-20" />
        </ScrollView>
      </View>

      <BottomSheet visible={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} height="85%">
        <View className="flex-1 bg-white rounded-t-[32px]">
          <View className="px-6 pt-2 pb-4">
            <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <View className="flex-row items-center border-b border-gray-100 pb-4">
              <Text className="flex-1 text-left text-[15px] text-gray-700 font-medium">{t('filters')}</Text>
              <TouchableOpacity onPress={clearFilters} className="flex-1 items-center">
                <Text className="text-[15px] font-bold text-black">{t('reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilters} className="flex-1 items-end">
                <Text className="text-[15px] font-bold text-black">{t('done')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView className="flex-1 px-6 mb-4" showsVerticalScrollIndicator={false}>
            <Text className="text-[15px] text-gray-700 mb-3">{t('type')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {['', 'EXPENSE', 'INCOME', 'TRANSFER'].map((tType) => (
                <TouchableOpacity
                  key={tType}
                  onPress={() => {
                    setTypeFilter(tType);
                    setCategoryFilter('');
                  }}
                  className={`px-5 py-2 rounded-full border ${
                    typeFilter === tType ? 'bg-gray-200 border-gray-400' : 'border-gray-300 bg-white'
                  }`}
                >
                  <Text className={`text-sm ${typeFilter === tType ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                    {tType === '' ? t('all') : t(tType.toLowerCase() as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-[15px] text-gray-700 mb-3">{t('categories')}</Text>
            
            <View className="mb-8 border border-[#E5E0D5] rounded-xl bg-[#FDF8EB] overflow-hidden">
              {Object.entries(groupedCategories).map(([groupId, group], index) => {
                const isExpanded = expandedGroup === groupId;
                return (
                  <View key={groupId} className={`${index > 0 ? 'border-t border-[#E5E0D5]' : ''}`}>
                    <TouchableOpacity
                      onPress={() => setExpandedGroup(isExpanded ? null : groupId)}
                      className={`p-4 flex-row justify-between items-center bg-[#FDF8EB]`}
                    >
                      <Text className="text-[15px] font-bold text-gray-900 ml-3">{t(group.name as any) || group.name}</Text>
                      {isExpanded ? (
                        <ChevronUp size={20} color="#111827" />
                      ) : (
                        <ChevronDown size={20} color="#4b5563" />
                      )}
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <View className="bg-white">
                        {group.items.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => setCategoryFilter(c.id)}
                            className={`py-3 pl-4 pr-4 flex-row items-center`}
                          >
                            <View className="mr-3">{renderCheckbox(categoryFilter === c.id)}</View>
                            <Text className="text-gray-800 text-[14px]">{c.slug ? (t(c.slug as any) !== c.slug ? t(c.slug as any) : (c.displayName || c.name)) : (c.displayName || c.name)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            <Text className="text-[15px] text-gray-700 mb-3">{t('accounts')}</Text>
            <View className="mb-8 gap-3">
              {accounts.map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setAccountFilter(a.id)}
                  className="p-4 flex-row justify-between items-center border border-[#E5E0D5] rounded-xl bg-[#F5F5F5]"
                >
                  <View className="flex-row items-center">
                    {renderCheckbox(accountFilter === a.id)}
                    <Text className="text-gray-900 font-medium ml-3">{a.name}</Text>
                  </View>
                  <AmountText amount={a.balance} className="text-gray-600 text-[14px]" showSign={false} />
                </TouchableOpacity>
              ))}
            </View>
            <View className="h-10" />
          </ScrollView>

          <View className="p-6 pt-2 pb-8">
            <Button label="Apply Filters" onPress={applyFilters} />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
