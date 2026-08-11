import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import { Appearance, Platform } from 'react-native';
import * as Device from 'expo-device';
import {
  initializeDatabase,
  supportsLocalDatabase,
} from '@/databases/initialize';
import {
  cacheContent,
  getCurrentCachedContent,
} from '@/databases/repositories/content.repository';
import { getLocalSetting } from '@/databases/repositories/setting.repository';
import {
  createInstallationId,
  createLocalUser,
  getLocalUser,
  type LocalUser,
  type LocalUserBasics,
  saveBackendUser,
  savePushToken,
} from '@/databases/repositories/user.repository';
import { api } from '@/helpers/api';
import {
  getDeviceLocale,
  getDeviceTimezone,
  getLocalDate,
} from '@/helpers/date/date';
import { getAuthorizedFcmToken } from '@/services/fcm';

export const LOCAL_CONTENT_QUERY_KEY = ['local', 'current-content'] as const;

interface BootstrapResponse {
  user: { id: string };
  setting: {
    enabled: boolean;
    notificationHour: number;
  };
}

interface TodayDeliveryResponse {
  deliveryId: string;
  deliveryDateLocal: string;
  channel: string;
  content: {
    id: string;
    key: string;
    text: string;
    format: string;
    languageCode: string;
  };
}

type BootstrapUser = LocalUserBasics & Pick<LocalUser, 'installationId'>;

async function bootstrapRemoteUser(
  user: BootstrapUser,
  pushToken: string | null,
) {
  const response = await api<BootstrapResponse>({
    url: '/users/bootstrap',
    method: 'POST',
    data: {
      installationId: user.installationId,
      timezone: user.timezone,
      locale: user.locale,
      platform: user.platform,
      deviceName: user.deviceName,
      osVersion: user.osVersion,
      appVersion: user.appVersion,
      pushToken,
    },
    options: { timeout: 10_000 },
  });
  if (!response.success || !response.data?.user.id) {
    throw new Error(response.message ?? 'Failed to bootstrap user');
  }

  return response.data;
}

function getLocalUserBasics() {
  return {
    locale: getDeviceLocale(),
    timezone: getDeviceTimezone(),
    platform: Platform.OS,
    deviceName: Device.deviceName,
    osVersion: Device.osVersion,
    appVersion: Constants.expoConfig?.version ?? null,
  };
}

async function getOrCreateUser() {
  const localUser = await getLocalUser();
  if (!localUser) {
    const basics = getLocalUserBasics();
    const [installationId, pushToken] = await Promise.all([
      createInstallationId(),
      getAuthorizedFcmToken(),
    ]);
    const remote = await bootstrapRemoteUser(
      {
        ...basics,
        installationId,
      },
      pushToken,
    );

    return createLocalUser({
      ...basics,
      installationId,
      backendUserId: remote.user.id,
      pushToken,
    });
  }
  return localUser;
}

export async function initializeLocalApp() {
  if (!supportsLocalDatabase()) return;

  await initializeDatabase();
  const setting = await getLocalSetting();
  Appearance.setColorScheme(
    setting.themePreference === 'system'
      ? 'unspecified'
      : setting.themePreference,
  );
}

export async function syncFirstInstallation() {
  if (!supportsLocalDatabase()) return false;

  const user = await getOrCreateUser();
  let backendUserId = user.backendUserId;
  const pushToken = await getAuthorizedFcmToken().catch(() => null);

  if (!backendUserId || (pushToken && pushToken !== user.pushToken)) {
    const response = await bootstrapRemoteUser(user, pushToken);
    backendUserId = response.user.id;
    await saveBackendUser(backendUserId);
    if (pushToken) await savePushToken(pushToken);
  }

  const cachedContent = await getCurrentCachedContent();
  if (cachedContent?.deliveryDateLocal === getLocalDate()) return false;

  const deliveryResponse = await api<TodayDeliveryResponse>({
    url: '/content-delivery/today',
    params: { userId: backendUserId },
    options: { timeout: 10_000 },
  });
  if (!deliveryResponse.success || !deliveryResponse.data) {
    throw new Error(
      deliveryResponse.message ?? 'Failed to fetch first content',
    );
  }

  const delivery = deliveryResponse.data;
  await cacheContent({
    deliveryId: delivery.deliveryId,
    contentId: delivery.content.id,
    contentKey: delivery.content.key,
    text: delivery.content.text,
    format: delivery.content.format,
    languageCode: delivery.content.languageCode,
    channel: delivery.channel,
    deliveryDateLocal: delivery.deliveryDateLocal,
    source: 'api',
  });
  return true;
}

export function subscribeToFcmTokenRefresh() {
  if (!supportsLocalDatabase() || Platform.OS === 'web') {
    return () => undefined;
  }

  try {
    return onTokenRefresh(getMessaging(), async (pushToken) => {
      try {
        const user = await getOrCreateUser();

        if (user.pushToken === pushToken) return;

        await Promise.all([
          bootstrapRemoteUser(user, pushToken),
          savePushToken(pushToken),
        ]);
      } catch (error: unknown) {
        console.warn('Failed to sync refreshed FCM token', error);
      }
    });
  } catch (error: unknown) {
    console.warn('Failed to subscribe to FCM token refresh', error);
    return () => undefined;
  }
}
