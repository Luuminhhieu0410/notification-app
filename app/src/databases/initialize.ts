import { openDatabaseAsync } from 'expo-sqlite';
import { Platform } from 'react-native';
import { migrateDatabase } from '@/databases/migrations';

const DATABASE_NAME = 'app.db';

export function supportsLocalDatabase() {
  return Platform.OS !== 'web';
}

export const databasePromise = openDatabaseAsync(DATABASE_NAME);
let initializationPromise: Promise<void> | null = null;

export async function initializeDatabase() {
  if (!supportsLocalDatabase()) {
    throw new Error('Local SQLite database is only supported on mobile');
  }
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const database = await databasePromise;
      await Promise.all([
        database.execAsync('PRAGMA journal_mode = WAL;'),
        database.execAsync('PRAGMA foreign_keys = ON;'),
      ]);
      await migrateDatabase(database);
    })().catch((error: unknown) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}
