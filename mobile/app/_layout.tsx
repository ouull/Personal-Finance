import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getAccessToken } from '../lib/auth/token-storage';
import { useAuthStore } from '../stores/auth-store';
import { apiClient } from '../lib/api/client';
import { View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { isAuthenticated, isInitialized, initialize, setUser, logout } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          initialize();
          return;
        }

        // Validate token and fetch user
        const response = await apiClient.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        } else {
          logout();
        }
      } catch (error) {
        // Interceptor will handle refresh automatically.
        // If it still fails, interceptor calls logout().
        console.error('Auth initialization failed', error);
      } finally {
        initialize();
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, initialize, logout, setUser]);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, segments, router]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
    </QueryClientProvider>
  );
}
