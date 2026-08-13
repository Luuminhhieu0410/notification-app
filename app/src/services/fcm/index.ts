import { Platform } from 'react-native';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { requestNotificationPermission } from '@/helpers/permission/notification-permisstion';

export async function getAuthorizedFcmToken() {
  if (Platform.OS === 'web') return null;
  if (!(await requestNotificationPermission())) return null;

  const messaging = getMessaging();

  return getToken(messaging);
}
