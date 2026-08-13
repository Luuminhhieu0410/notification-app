import { RemoteMessage } from '@react-native-firebase/messaging';
import {
  initializeDatabase,
  supportsLocalDatabase,
} from '@/databases/initialize';
import { dataString } from '@/helpers/string/dataString';
import {
  cacheContent,
  CachedContent,
  getCurrentCachedContent,
} from '@/databases/repositories/content.repository';
import { getLocalDate } from '@/helpers/date/date';

export async function cacheBackgroundNotification(
  remoteMessage: RemoteMessage,
) {
  if (!supportsLocalDatabase()) return false;
  await initializeDatabase();

  const data = remoteMessage.data;
  const deliveryId = dataString(data?.deliveryId) ?? remoteMessage.messageId;
  const text =
    dataString(data?.text) ??
    dataString(data?.message) ??
    remoteMessage.notification?.body;
  if (!deliveryId || !text) return false;

  await cacheContent({
    deliveryId,
    contentId: dataString(data?.contentId) ?? `notification:${deliveryId}`,
    contentKey: dataString(data?.contentKey) ?? null,
    text,
    format: dataString(data?.format) ?? 'prose',
    languageCode: dataString(data?.languageCode) ?? 'vi',
    deliveryDateLocal: dataString(data?.deliveryDateLocal) ?? getLocalDate(),
    source: 'notification',
  });
  return true;
}

export async function getCachedContent(): Promise<CachedContent | null> {
  if (!supportsLocalDatabase()) return null;
  return getCurrentCachedContent();
}
