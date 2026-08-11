import { databasePromise } from '@/databases/initialize';

export interface CachedContent {
  deliveryId: string;
  contentId: string;
  contentKey: string | null;
  text: string;
  format: string;
  languageCode: string;
  channel: string;
  deliveryDateLocal: string;
  source: 'api' | 'background_notification';
  receivedAt: string;
}

interface CachedContentRow {
  delivery_id: string;
  content_id: string;
  content_key: string | null;
  text: string;
  format: string;
  language_code: string;
  channel: string;
  delivery_date_local: string;
  source: CachedContent['source'];
  received_at: string;
}

export async function cacheContent(content: Omit<CachedContent, 'receivedAt'>) {
  const database = await databasePromise;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      'UPDATE cached_deliveries SET is_current = 0 WHERE is_current = 1',
    );
    await transaction.runAsync(
      `INSERT INTO cached_deliveries (
        delivery_id,
        content_id,
        content_key,
        text,
        format,
        language_code,
        channel,
        delivery_date_local,
        source,
        received_at,
        is_current
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(delivery_id) DO UPDATE SET
        content_id = excluded.content_id,
        content_key = excluded.content_key,
        text = excluded.text,
        format = excluded.format,
        language_code = excluded.language_code,
        channel = excluded.channel,
        delivery_date_local = excluded.delivery_date_local,
        source = excluded.source,
        received_at = excluded.received_at,
        is_current = 1`,
      [
        content.deliveryId,
        content.contentId,
        content.contentKey,
        content.text,
        content.format,
        content.languageCode,
        content.channel,
        content.deliveryDateLocal,
        content.source,
        new Date().toISOString(),
      ],
    );
  });
}

export async function getCurrentCachedContent(): Promise<CachedContent | null> {
  const database = await databasePromise;

  const row = await database.getFirstAsync<CachedContentRow>(
    `SELECT * FROM cached_deliveries
     WHERE is_current = 1
     ORDER BY received_at DESC
     LIMIT 1`,
  );
  if (!row) return null;

  return {
    deliveryId: row.delivery_id,
    contentId: row.content_id,
    contentKey: row.content_key,
    text: row.text,
    format: row.format,
    languageCode: row.language_code,
    channel: row.channel,
    deliveryDateLocal: row.delivery_date_local,
    source: row.source,
    receivedAt: row.received_at,
  };
}
