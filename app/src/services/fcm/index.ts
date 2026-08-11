import { Platform } from 'react-native';
import { getMessaging, getToken } from '@react-native-firebase/messaging';

export async function getAuthorizedFcmToken() {
  if (Platform.OS === 'web') return null;

  const messaging = getMessaging();

  return getToken(messaging);
}
