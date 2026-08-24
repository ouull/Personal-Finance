import { Tabs, useSegments } from 'expo-router';
import { Home, List, Wallet, PieChart, User } from 'lucide-react-native';
import { QuickCaptureFAB } from '../../components/ui/quick-capture-fab';

export default function TabsLayout() {
  const segments = useSegments();
  
  // Conditionally show FAB on dashboard ('index') and transactions.
  // segments inside (tabs) look like ['(tabs)', 'index'] or ['(tabs)', 'transactions']
  const currentTab = segments[segments.length - 1];
  const showFAB = currentTab === 'index' || currentTab === 'transactions' || currentTab === '(tabs)';

  return (
    <>
      <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <Home color={color} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transaksi',
            tabBarIcon: ({ color }) => <List color={color} />,
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Akun',
            tabBarIcon: ({ color }) => <Wallet color={color} />,
          }}
        />
        <Tabs.Screen
          name="investments"
          options={{
            title: 'Investasi',
            tabBarIcon: ({ color }) => <PieChart color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User color={color} />,
          }}
        />
      </Tabs>
      <QuickCaptureFAB visible={showFAB} />
    </>
  );
}

