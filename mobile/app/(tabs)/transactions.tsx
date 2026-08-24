import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react-native';
import { apiClient } from '../../lib/api/client';
import { queryKeys } from '../../lib/api/keys';
import { useTranslation } from '../../lib/i18n';
import { Screen } from '../../components/ui/screen';
import { Card } from '../../components/ui/card';
import { AmountText } from '../../components/ui/amount-text';
import { SectionHeader } from '../../components/ui/section-header';
import { EmptyState } from '../../components/ui/empty-state';
import { BottomSheet } from '../../components/ui/bottom-sheet';
import { Button } from '../../components/ui/button';

export default function TransactionsScreen() {
  const { t } = useTranslation();

  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
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
      let url = `/transactions?page=${pageParam}&limit=20`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (categoryFilter) url += `&categoryId=${categoryFilter}`;
      if (accountFilter) url += `&accountId=${accountFilter}`;
      const response = await apiClient.get(url);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.data?.pagination?.hasNextPage) {
        return lastPage.data.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const transactions = data?.pages.flatMap((page) => page.data?.items || []) || [];

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

  if (isError) {
    return (
      <Screen className="justify-center">
        <EmptyState title={t('errorOccurred')} actionLabel={t('tryAgain')} onAction={refetch} />
      </Screen>
    );
  }

  const renderTransaction = ({ item }: { item: any }) => (
    <Card className="mb-3 flex-row justify-between items-center py-3 border-0 bg-white">
      <View>
        <Text className="font-semibold text-gray-900 text-base">
          {item.category ? item.category.displayName : item.type}
        </Text>
        <Text className="text-gray-500 text-xs mt-1">
          {new Date(item.date).toLocaleDateString()} • {item.account?.name || '-'}
          {item.merchantName ? ` • ${item.merchantName}` : ''}
        </Text>
      </View>
      <AmountText amount={item.amount} type={item.type} className="font-bold text-base" />
    </Card>
  );

  return (
    <Screen safeArea={false}>
      <View className="flex-1 px-4 pt-12 pb-24 bg-gray-50">
        <SectionHeader 
          title={t('transactions')} 
          action={
            <TouchableOpacity 
              className="bg-gray-200 p-2 rounded-full"
              onPress={() => setIsFilterSheetOpen(true)}
            >
              <Filter color="#374151" size={20} />
            </TouchableOpacity>
          } 
        />

        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="my-4" color="#2563eb" />
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <EmptyState title={t('noTransactions')} />
            ) : null
          }
        />
      </View>

      <BottomSheet visible={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} height="85%">
        <View className="flex-1 p-6">
          <Text className="text-2xl font-bold mb-6">{t('filterTransactions')}</Text>
          
          <Text className="font-semibold text-gray-900 mb-3">{t('type')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {['', 'EXPENSE', 'INCOME', 'TRANSFER'].map((tType) => (
              <TouchableOpacity
                key={tType}
                onPress={() => {
                  setTypeFilter(tType);
                  setCategoryFilter(''); // Reset category on type change
                }}
                className={`px-4 py-2 rounded-full border ${
                  typeFilter === tType ? 'bg-blue-100 border-blue-600' : 'border-gray-300'
                }`}
              >
                <Text className={typeFilter === tType ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {tType === '' ? t('all') : tType === 'EXPENSE' ? t('expense') : tType === 'INCOME' ? t('income') : t('transfer')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold text-gray-900 mb-3">{t('category')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            <TouchableOpacity
              onPress={() => setCategoryFilter('')}
              className={`px-4 py-2 rounded-full border ${
                categoryFilter === '' ? 'bg-blue-100 border-blue-600' : 'border-gray-300'
              }`}
            >
              <Text className={categoryFilter === '' ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                {t('all')}
              </Text>
            </TouchableOpacity>
            {categories.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setCategoryFilter(c.id)}
                className={`px-4 py-2 rounded-full border ${
                  categoryFilter === c.id ? 'bg-blue-100 border-blue-600' : 'border-gray-300'
                }`}
              >
                <Text className={categoryFilter === c.id ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {c.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold text-gray-900 mb-3">{t('account')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            <TouchableOpacity
              onPress={() => setAccountFilter('')}
              className={`px-4 py-2 rounded-full border ${
                accountFilter === '' ? 'bg-blue-100 border-blue-600' : 'border-gray-300'
              }`}
            >
              <Text className={accountFilter === '' ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                {t('all')}
              </Text>
            </TouchableOpacity>
            {accounts.map((a: any) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setAccountFilter(a.id)}
                className={`px-4 py-2 rounded-full border ${
                  accountFilter === a.id ? 'bg-blue-100 border-blue-600' : 'border-gray-300'
                }`}
              >
                <Text className={accountFilter === a.id ? 'text-blue-700 font-medium' : 'text-gray-700'}>
                  {a.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row mt-auto gap-4">
            <Button label="Reset" variant="outline" onPress={clearFilters} className="flex-1" />
            <Button label="Terapkan" onPress={applyFilters} className="flex-1" />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}
