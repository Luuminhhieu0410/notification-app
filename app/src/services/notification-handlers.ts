import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
    buildDailyContentChannel(Notifications.AndroidImportance.DEFAULT),
  );
}

export function subscribeToForegroundNotifications(
  onDeliveryReceived: (deliveryId: string) => void,
) {
  if (Platform.OS === 'web') return () => undefined;

  return onMessage(getMessaging(), async (remoteMessage) => {
    try {
      const deliveryId = dataString(remoteMessage.data?.deliveryId);
      if (deliveryId) onDeliveryReceived(deliveryId);

      await Notifications.scheduleNotificationAsync({
        ...(deliveryId ? { identifier: `foreground-${deliveryId}` } : {}),
        content: {
          title: remoteMessage.notification?.title ?? 'Daily Noti',
          body: remoteMessage.notification?.body ?? 'Bạn có nội dung mới.',
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

export function subscribeToNotificationResponses(
  onDeliverySelected: (deliveryId: string) => void,
) {
  if (Platform.OS === 'web') return () => undefined;

  let lastIdentifier: string | null = null;
  const handleResponse = (response: Notifications.NotificationResponse) => {
    const identifier = response.notification.request.identifier;
    if (identifier === lastIdentifier) return;
    lastIdentifier = identifier;
    const deliveryId = dataString(
      response.notification.request.content.data?.deliveryId,
    );
    if (deliveryId) onDeliverySelected(deliveryId);
  };

  const initialResponse = Notifications.getLastNotificationResponse();
  if (initialResponse) handleResponse(initialResponse);
  const subscription =
    Notifications.addNotificationResponseReceivedListener(handleResponse);
  return () => subscription.remove();
}
