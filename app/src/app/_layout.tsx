import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
// import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import {
  initializeLocalApp,
  subscribeToFcmTokenRefresh,
} from '@/services/app-bootstrap';
import {
  HOME_CONTENT_QUERY_KEY,
  loadDelivery,
} from '@/services/home-content-service';
import {
  initializeNotificationChannel,
  subscribeToForegroundNotifications,
  subscribeToNotificationResponses,
} from '@/services/notification-handlers';
import { showShortToast } from '@/helpers/toast/showShortToast';
import { AxiosError } from 'axios';
import { UserProvider, useUser } from '@/context/UserContext';

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

  if ((!fontsLoaded && !fontError) || !localAppReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <UserProvider>
            <AppRuntime />
          </UserProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppRuntime() {
  const queryClient = useQueryClient();
  const { user, error } = useUser();

  useEffect(() => {
    if (!error) return;
    console.warn('User sync will retry on next launch', error);
    showShortToast(
      error instanceof AxiosError ? 'Network Error' : 'Error Sync User',
    );
  }, [error]);

  useEffect(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: HOME_CONTENT_QUERY_KEY });
    return subscribeToFcmTokenRefresh(user);
  }, [queryClient, user]);

  useEffect(() => {
    if (!user) return;

    const showDelivery = (deliveryId: string) => {
      void loadDelivery(user.id, deliveryId)
        .then((delivery) => {
          queryClient.setQueryData(HOME_CONTENT_QUERY_KEY, delivery);
        })
        .catch((notificationError: unknown) => {
          console.warn(
            'Failed to load notification content',
            notificationError,
          );
          showShortToast('Không thể tải nội dung thông báo.');
        });
    };
    const unsubscribeForeground =
      subscribeToForegroundNotifications(showDelivery);
    const unsubscribeResponses = subscribeToNotificationResponses(showDelivery);
    return () => {
      unsubscribeForeground();
      unsubscribeResponses();
    };
  }, [queryClient, user]);

  return <AppTabs />;
}
