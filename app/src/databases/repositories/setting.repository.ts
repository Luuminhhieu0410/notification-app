import { databasePromise } from '../initialize';

export type ThemePreference = 'system' | 'light' | 'dark';

interface LocalSettingRow {
  theme_preference: ThemePreference;
  updated_at: string;
}

export interface LocalSetting {
  themePreference: ThemePreference;
  updatedAt: string;
}

export async function getLocalSetting(): Promise<LocalSetting> {
  const database = await databasePromise;
  const row = await database.getFirstAsync<LocalSettingRow>(
    'SELECT * FROM local_settings WHERE id = 1',
  );
  if (!row) throw new Error('Local setting was not initialized');

  return {
    themePreference: row.theme_preference,
    updatedAt: row.updated_at,
  };
}

export async function updateThemePreference(themePreference: ThemePreference) {
  const database = await databasePromise;
  await database.runAsync(
    `UPDATE local_settings SET
      theme_preference = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = 1`,
    [themePreference],
  );
}
