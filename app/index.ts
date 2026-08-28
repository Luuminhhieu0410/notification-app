import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { configureNotificationPresentation } from '@/services/notification-handlers';

configureNotificationPresentation();

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async () => undefined);
// void SplashScreen.preventAutoHideAsync();
// The router entry must load after the background handler is registered.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('expo-router/entry');
