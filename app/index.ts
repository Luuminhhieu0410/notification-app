import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { cacheBackgroundNotification } from '@/services/cache/notification';
import { configureNotificationPresentation } from '@/services/notification-handlers';

configureNotificationPresentation();

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  await cacheBackgroundNotification(remoteMessage);
});

// The router entry must load after the background handler is registered.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('expo-router/entry');
