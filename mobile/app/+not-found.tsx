import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from '../lib/i18n';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('oops') }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{t('pageNotFound')}</Text>
        <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Text style={{ color: '#2e78b7' }}>{t('backToHome')}</Text>
        </Link>
      </View>
    </>
  );
}
