import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { migrateDatabase } from '@/databases/migrations';

const DATABASE_NAME = 'app.db';

export function supportsLocalDatabase() {
  return Platform.OS !== 'web';
}

export const databasePromise = openDatabaseAsync(DATABASE_NAME);

export async function initializeDatabase() {
  if (!supportsLocalDatabase()) {
    throw new Error('Local SQLite database is only supported on mobile');
  }
  const database = await databasePromise;

  await Promise.all([
    database.execAsync('PRAGMA journal_mode = WAL;'),
    database.execAsync('PRAGMA foreign_keys = ON;'),
  ]);
  await migrateDatabase(database);
}
