import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import {
  initializeLocalApp,
  subscribeToFcmTokenRefresh,
  syncFirstInstallation,
} from '@/services/app-bootstrap';
import { HOME_CONTENT_QUERY_KEY } from '@/services/home-content-service';
import {
  initializeNotificationChannel,
  subscribeToForegroundNotifications,
} from '@/services/notification-handlers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [localAppReady, setLocalAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    let active = true;

    void Promise.all([initializeLocalApp(), initializeNotificationChannel()])
      .catch((error: unknown) => {
        console.warn('Failed to initialize local app data', error);
      })
      .finally(() => {
        if (active) setLocalAppReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // useEffect(() => {
  //   if ((fontsLoaded || fontError) && localAppReady) {
  //     void SplashScreen.hideAsync();
  //   }
  // }, [fontError, fontsLoaded, localAppReady]);

  useEffect(() => {
    if (!localAppReady) return;

    void syncFirstInstallation()
      .then(() => {
        return queryClient.invalidateQueries({
          queryKey: HOME_CONTENT_QUERY_KEY,
        });
      })
      .catch((error: unknown) => {
        console.warn(
          'First-install sync will retry on next launch',
          JSON.stringify(error),
        );
      });
  }, [localAppReady]);

  useEffect(() => {
    if (!localAppReady) return;
    return subscribeToFcmTokenRefresh();
  }, [localAppReady]);

  useEffect(() => {
    if (!localAppReady) return;
    return subscribeToForegroundNotifications(() => {
      void queryClient.invalidateQueries({
        queryKey: HOME_CONTENT_QUERY_KEY,
      });
    });
  }, [localAppReady]);

  if ((!fontsLoaded && !fontError) || !localAppReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <AppTabs />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
