import { databasePromise } from '@/databases/initialize';

export async function getAppState(key: string) {
  const database = await databasePromise;
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_state WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setAppState(key: string, value: string) {
  const database = await databasePromise;
  await database.runAsync(
    `INSERT INTO app_state (key, value, updated_at)
     VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
    [key, value],
  );
}
