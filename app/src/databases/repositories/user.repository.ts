import { databasePromise } from '@/databases/initialize';

interface LocalUserRow {
  id: string;
  locale: string;
  timezone: string;
  platform: string;
  device_name: string | null;
  os_version: string | null;
  app_version: string | null;
  install_at: string;
  synced_at: string | null;
  push_token: string | null;
}

export interface LocalUser {
  id: string;
  locale: string;
  timezone: string;
  platform: string;
  deviceName: string | null;
  osVersion: string | null;
  appVersion: string | null;
  installAt: string;
  syncedAt: string | null;
  pushToken: string | null;
}

export type LocalUserBasics = Omit<
  LocalUser,
  'id' | 'installAt' | 'syncedAt' | 'pushToken'
>;

export interface CreateLocalUserInput extends LocalUserBasics {
  id: string;
  pushToken: string | null;
}

function mapUser(row: LocalUserRow): LocalUser {
  return {
    id: row.id,
    locale: row.locale,
    timezone: row.timezone,
    platform: row.platform,
    deviceName: row.device_name,
    osVersion: row.os_version,
    appVersion: row.app_version,
    installAt: row.install_at,
    syncedAt: row.synced_at,
    pushToken: row.push_token,
  };
}

export async function getLocalUser() {
  const database = await databasePromise;
  const row = await database.getFirstAsync<LocalUserRow>(
    'SELECT * FROM local_user LIMIT 1',
  );
  return row ? mapUser(row) : null;
}

export async function createLocalUser(input: CreateLocalUserInput) {
  const database = await databasePromise;
  await database.runAsync(
    `INSERT INTO local_user (
      id,
      locale,
      timezone,
      platform,
      device_name,
      os_version,
      app_version,
      install_at,
      synced_at,
      push_token
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      ?
    )`,
    [
      input.id,
      input.locale,
      input.timezone,
      input.platform,
      input.deviceName,
      input.osVersion,
      input.appVersion,
      input.pushToken,
    ],
  );

  const user = await getLocalUser();
  if (!user) throw new Error('Failed to initialize local user');
  return user;
}

export async function savePushToken(pushToken: string) {
  const database = await databasePromise;
  await database.runAsync('UPDATE local_user SET push_token = ?', [pushToken]);
}
