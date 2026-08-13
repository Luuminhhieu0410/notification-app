import { databasePromise } from '@/databases/initialize';

export interface CachedContent {
  deliveryId: string;
  contentId: string;
  contentKey: string | null;
  text: string;
  format: string;
  languageCode: string;
  deliveryDateLocal: string;
  source: 'api' | 'notification';
  receivedAt: string;
}

interface CachedContentRow {
  delivery_id: string;
  content_id: string;
  content_key: string | null;
  text: string;
  format: string;
  language_code: string;
  delivery_date_local: string;
  source: CachedContent['source'];
  received_at: string;
}

function mapContent(row: CachedContentRow): CachedContent {
  return {
    deliveryId: row.delivery_id,
    contentId: row.content_id,
    contentKey: row.content_key,
    text: row.text,
    format: row.format,
    languageCode: row.language_code,
    deliveryDateLocal: row.delivery_date_local,
    source: row.source,
    receivedAt: row.received_at,
  };
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
        delivery_date_local,
        source,
        received_at,
        is_current
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(delivery_id) DO UPDATE SET
        content_id = excluded.content_id,
        content_key = excluded.content_key,
        text = excluded.text,
        format = excluded.format,
        language_code = excluded.language_code,
        delivery_date_local = excluded.delivery_date_local,
        source = excluded.source,
        is_current = 1`,
      [
        content.deliveryId,
        content.contentId,
        content.contentKey,
        content.text,
        content.format,
        content.languageCode,
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

  return mapContent(row);
}

async function selectAdjacentCachedContent(
  direction: 'previous' | 'next',
): Promise<CachedContent | null> {
  const database = await databasePromise;
  let adjacent: CachedContentRow | null = null;

  await database.withExclusiveTransactionAsync(async (transaction) => {
    const current = await transaction.getFirstAsync<CachedContentRow>(
      `SELECT * FROM cached_deliveries
       WHERE is_current = 1
       ORDER BY received_at DESC, delivery_id DESC
       LIMIT 1`,
    );
    if (!current) return;

    const isPrevious = direction === 'previous';
    adjacent = await transaction.getFirstAsync<CachedContentRow>(
      `SELECT * FROM cached_deliveries
       WHERE received_at ${isPrevious ? '<' : '>'} ?
          OR (received_at = ? AND delivery_id ${isPrevious ? '<' : '>'} ?)
       ORDER BY received_at ${isPrevious ? 'DESC' : 'ASC'},
                delivery_id ${isPrevious ? 'DESC' : 'ASC'}
       LIMIT 1`,
      [current.received_at, current.received_at, current.delivery_id],
    );
    if (!adjacent) return;

    await transaction.runAsync(
      'UPDATE cached_deliveries SET is_current = 0 WHERE is_current = 1',
    );
    await transaction.runAsync(
      'UPDATE cached_deliveries SET is_current = 1 WHERE delivery_id = ?',
      [adjacent.delivery_id],
    );
  });

  return adjacent ? mapContent(adjacent) : null;
}

async function hasAdjacentCachedContent(direction: 'previous' | 'next') {
  const database = await databasePromise;
  const current = await database.getFirstAsync<CachedContentRow>(
    `SELECT * FROM cached_deliveries
     WHERE is_current = 1
     ORDER BY received_at DESC, delivery_id DESC
     LIMIT 1`,
  );
  if (!current) return false;

  const isPrevious = direction === 'previous';
  const row = await database.getFirstAsync<{ delivery_id: string }>(
    `SELECT delivery_id FROM cached_deliveries
     WHERE received_at ${isPrevious ? '<' : '>'} ?
        OR (received_at = ? AND delivery_id ${isPrevious ? '<' : '>'} ?)
     LIMIT 1`,
    [current.received_at, current.received_at, current.delivery_id],
  );
  return Boolean(row);
}

export function getPreviousCachedContent() {
  return selectAdjacentCachedContent('previous');
}

export function getNextCachedContent() {
  return selectAdjacentCachedContent('next');
}

export function hasPreviousCachedContent() {
  return hasAdjacentCachedContent('previous');
}

export function hasNextCachedContent() {
  return hasAdjacentCachedContent('next');
}
