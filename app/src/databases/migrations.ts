import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

const CURRENT_SCHEMA = `
  CREATE TABLE local_user (
    id TEXT PRIMARY KEY,
    locale TEXT NOT NULL,
    timezone TEXT NOT NULL,
    platform TEXT NOT NULL,
    device_name TEXT,
    os_version TEXT,
    app_version TEXT,
    install_at TEXT NOT NULL,
    synced_at TEXT,
    push_token TEXT
  );

  CREATE TABLE local_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme_preference TEXT NOT NULL DEFAULT 'system'
      CHECK (theme_preference IN ('system', 'light', 'dark')),
    updated_at TEXT NOT NULL
  );

  INSERT INTO local_settings (
    id,
    theme_preference,
    updated_at
  ) VALUES (1, 'system', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
`;

export async function migrateDatabase(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );

  if ((row?.user_version ?? 0) >= DATABASE_VERSION) return;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(CURRENT_SCHEMA);
    await transaction.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
