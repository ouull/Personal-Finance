import { Tabs, useSegments } from 'expo-router';
import { LayoutGrid, Wallet, ReceiptText, CalendarDays, TrendingUp } from 'lucide-react-native';
import { QuickCaptureFAB } from '../../components/ui/quick-capture-fab';
import { useTranslation } from '../../lib/i18n';

export default function TabsLayout() {
  const segments = useSegments();
  const { t } = useTranslation();
  
  // Conditionally show FAB on dashboard ('index') and transactions.
  // segments inside (tabs) look like ['(tabs)', 'index'] or ['(tabs)', 'transactions']
  const currentTab = segments[segments.length - 1] as string;
  const showFAB = currentTab === 'index' || currentTab === 'transactions' || currentTab === 'recurring' || currentTab === '(tabs)';

  return (
    <>
      <Tabs screenOptions={{ tabBarActiveTintColor: '#000000', tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E0D5' } }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('dashboard'),
            headerShown: false,
            tabBarIcon: ({ color }) => <LayoutGrid color={color} />,
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: t('accounts'),
            headerShown: false,
            tabBarIcon: ({ color }) => <Wallet color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: t('transactions'),
            headerShown: false,
            tabBarIcon: ({ color }) => <ReceiptText color={color} />,
          }}
        />
        <Tabs.Screen
          name="recurring"
          options={{
            title: t('recurring'),
            headerShown: false,
            tabBarIcon: ({ color }) => <CalendarDays color={color} />,
          }}
        />
        <Tabs.Screen
          name="investments"
          options={{
            title: t('wealth'),
            headerShown: false,
            tabBarIcon: ({ color }) => <TrendingUp color={color} />,
          }}
        />
      </Tabs>
      <QuickCaptureFAB visible={showFAB} />
    </>
  );
}

