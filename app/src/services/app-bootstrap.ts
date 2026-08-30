import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import { Appearance, Platform } from 'react-native';
import * as Device from 'expo-device';
import {
  initializeDatabase,
  supportsLocalDatabase,
} from '@/databases/initialize';
import { getLocalSetting } from '@/databases/repositories/setting.repository';
import {
  createLocalUser,
  getLocalUser,
  type LocalUser,
  type LocalUserBasics,
  savePushToken,
} from '@/databases/repositories/user.repository';
import { api } from '@/helpers/api';
import { getDeviceLocale, getDeviceTimezone } from '@/helpers/date/date';
import { getAuthorizedFcmToken } from '@/services/fcm';

interface BootstrapResponse {
  user: { id: string };
  setting: {
    enabled: boolean;
    notificationHour: number;
  };
}

async function bootstrapRemoteUser(
  user: LocalUserBasics,
  pushToken: string | null,
) {
  const response = await api<BootstrapResponse>({
    url: '/users/bootstrap',
    method: 'POST',
    data: {
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
  let localUser = await getLocalUser();

  if (!localUser) {
    const basics = getLocalUserBasics();
    const pushToken = await getAuthorizedFcmToken().catch((error) => {
      console.warn('Failed to get FCM token', error);
      return null;
    });

    const remote = await bootstrapRemoteUser(basics, pushToken);
    localUser = await createLocalUser({
      ...basics,
      id: remote.user.id,
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

export async function syncCurrentUser() {
  if (!supportsLocalDatabase()) return null;
  return getOrCreateUser();
}

export function subscribeToFcmTokenRefresh(user: LocalUser) {
  if (!supportsLocalDatabase() || Platform.OS === 'web') {
    return () => undefined;
  }

  try {
    let currentToken = user.pushToken;
    return onTokenRefresh(getMessaging(), async (pushToken) => {
      try {
        if (currentToken === pushToken) return;

        await Promise.all([
          api({
            url: '/users/token',
            method: 'PUT',
            data: { userId: user.id, token: pushToken },
          }),
          savePushToken(pushToken),
        ]);
        currentToken = pushToken;
      } catch (error: unknown) {
        console.warn('Failed to sync refreshed FCM token', error);
      }
    });
  } catch (error: unknown) {
    console.warn('Failed to subscribe to FCM token refresh', error);
    return () => undefined;
  }
}
