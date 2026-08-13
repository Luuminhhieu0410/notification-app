import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { cacheBackgroundNotification } from '@/services/cache/notification';
import { dataString } from '@/helpers/string/dataString';
import { buildDailyContentChannel } from '@/services/notification-channel';

const DAILY_CONTENT_CHANNEL = 'daily-content';

export function configureNotificationPresentation() {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
}

export async function initializeNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(
    DAILY_CONTENT_CHANNEL,
    buildDailyContentChannel(Notifications.AndroidImportance.HIGH),
  );
}

export function subscribeToForegroundNotifications(
  onContentUpdated: () => void,
) {
  if (Platform.OS === 'web') return () => undefined;

  return onMessage(getMessaging(), async (remoteMessage) => {
    try {
      const cached = await cacheBackgroundNotification(remoteMessage);
      if (!cached) return;

      onContentUpdated();
      const deliveryId = dataString(remoteMessage.data?.deliveryId);
      await Notifications.scheduleNotificationAsync({
        ...(deliveryId ? { identifier: `foreground-${deliveryId}` } : {}),
        content: {
          title: remoteMessage.notification?.title ?? 'Daily Noti',
          body:
            remoteMessage.notification?.body ??
            dataString(remoteMessage.data?.text) ??
            'Bạn có nội dung mới.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { ...remoteMessage.data, source: 'fcm_foreground' },
        },
        trigger: null,
      });
    } catch (error: unknown) {
      console.warn('Failed to handle foreground notification', error);
    }
  });
}
