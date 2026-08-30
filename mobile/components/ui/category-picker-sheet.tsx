import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet } from './bottom-sheet';
import { useTranslation } from '../../lib/i18n';

interface Category {
  id: string;
  name: string;
  slug?: string | null;
}

interface CategoryPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSelect: (categoryId: string) => void;
}

const CATEGORY_GROUPS = [
  { id: 'food_and_beverage', slugs: ['food', 'beverage', 'coffee', 'restaurant', 'snack'] },
  { id: 'transportation', slugs: ['fuel', 'online_transport', 'parking', 'toll', 'vehicle_service'] },
  { id: 'shopping', slugs: ['online_shopping', 'fashion', 'electronics', 'household', 'marketplace'] },
  { id: 'entertainment', slugs: ['game', 'game_topup', 'streaming', 'movie', 'entertainment'] },
  { id: 'digital_and_subscriptions', slugs: ['phone_credit', 'mobile_data', 'internet', 'cloud_storage', 'software', 'subscription'] },
  { id: 'personal', slugs: ['cigarettes', 'vape', 'vape_liquid', 'pod_cartridge', 'personal_care'] },
  { id: 'living', slugs: ['rent', 'electricity', 'water', 'home_supplies'] },
  { id: 'health', slugs: ['medicine', 'doctor', 'hospital', 'fitness'] },
  { id: 'education', slugs: ['books', 'course', 'education', 'certification'] },
  { id: 'financial', slugs: ['admin_fee', 'bank_fee', 'transfer_fee', 'tax'] },
  { id: 'social_and_other', slugs: ['gift', 'donation', 'family', 'other'] },
];

export function CategoryPickerSheet({ visible, onClose, categories, onSelect }: CategoryPickerSheetProps) {
  const { t } = useTranslation();

  const groupedCategories: Record<string, Category[]> = {};
  
  CATEGORY_GROUPS.forEach(group => {
    const cats = categories.filter(c => c.slug && group.slugs.includes(c.slug));
    if (cats.length > 0) {
      groupedCategories[group.id] = cats;
    }
  });

  const allGroupedSlugs = CATEGORY_GROUPS.flatMap(g => g.slugs);
  const customCategories = categories.filter(c => !c.slug || !allGroupedSlugs.includes(c.slug));
  
  if (customCategories.length > 0) {
    groupedCategories['my_categories'] = customCategories;
  }

  // Helper to translate group names
  const getGroupName = (groupId: string) => {
    // We assume groups translations are somehow accessible, maybe via t(`groups.${groupId}`) 
    // In our mobile i18n, the translations are flat or nested depending on implementation.
    // Let's use `t` safely.
    const trans = t(groupId as any); 
    if (trans && trans !== groupId) return trans;
    // Fallback if not found in root, check if we need to do anything else.
    // Actually our mobile i18n might not support nested keys easily. We'll just provide default strings if t() fails.
    const defaults: Record<string, string> = {
      'food_and_beverage': 'Makanan & Minuman',
      'transportation': 'Transportasi',
      'shopping': 'Belanja',
      'entertainment': 'Hiburan',
      'digital_and_subscriptions': 'Digital & Langganan',
      'personal': 'Personal',
      'living': 'Tempat Tinggal',
      'health': 'Kesehatan',
      'education': 'Pendidikan',
      'financial': 'Keuangan',
      'social_and_other': 'Sosial & Lainnya',
      'my_categories': 'Kategori Saya'
    };
    return defaults[groupId] || groupId;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={500}>
      <View className="flex-1 pb-6">
        <View className="p-4 border-b border-gray-100 bg-white">
          <Text className="text-lg font-bold text-gray-900">{t('selectCategory')}</Text>
        </View>
        <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
          {Object.entries(groupedCategories).map(([groupId, cats]) => (
            <View key={groupId} className="mb-4">
              <View className="bg-gray-50 px-3 py-2 mt-2 rounded-lg">
                <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {getGroupName(groupId)}
                </Text>
              </View>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  className="py-4 border-b border-gray-50 pl-3 flex-row items-center"
                  onPress={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                >
                  <Text className="text-base text-gray-900">{(c.slug && t(c.slug as any) !== c.slug) ? t(c.slug as any) : c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      </View>
    </BottomSheet>
  );
}
