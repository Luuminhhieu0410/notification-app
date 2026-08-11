import type { SQLiteDatabase } from 'expo-sqlite';

interface Migration {
  version: number;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE local_user (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        installation_id TEXT NOT NULL UNIQUE,
        backend_user_id TEXT UNIQUE,
        locale TEXT NOT NULL,
        timezone TEXT NOT NULL,
        platform TEXT NOT NULL,
        device_name TEXT,
        os_version TEXT,
        app_version TEXT,
        install_at TEXT NOT NULL,
        synced_at TEXT
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

      CREATE TABLE cached_deliveries (
        delivery_id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL,
        content_key TEXT,
        text TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'prose',
        language_code TEXT NOT NULL DEFAULT 'vi',
        channel TEXT NOT NULL,
        delivery_date_local TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'api',
        received_at TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 1
          CHECK (is_current IN (0, 1))
      );

      CREATE INDEX cached_deliveries_current_idx
        ON cached_deliveries(is_current, received_at DESC);

      CREATE TABLE app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE local_user ADD COLUMN push_token TEXT;
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE local_settings_next (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        theme_preference TEXT NOT NULL DEFAULT 'system'
          CHECK (theme_preference IN ('system', 'light', 'dark')),
        updated_at TEXT NOT NULL
      );

      INSERT INTO local_settings_next (id, theme_preference, updated_at)
      SELECT id, theme_preference, updated_at FROM local_settings;

      DROP TABLE local_settings;
      ALTER TABLE local_settings_next RENAME TO local_settings;
    `,
  },
];

export async function migrateDatabase(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = row?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.execAsync(migration.sql);
      await transaction.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
