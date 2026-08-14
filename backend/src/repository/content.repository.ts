import { Injectable } from '@nestjs/common';
import { type Content, Prisma } from '@/generated/prisma/client';
import type { RepositoryClient } from './repository.types';

export type DeliveryContent = Pick<
  Content,
  'id' | 'key' | 'text' | 'format' | 'languageCode'
>;

@Injectable()
export class ContentRepository {
  findRandomUndelivered(userId: string, transaction: RepositoryClient) {
    return transaction.$queryRaw<DeliveryContent[]>(Prisma.sql`
      SELECT
        c."id",
        c."key",
        c."text",
        c."format",
        c."language_code" AS "languageCode"
      FROM "contents" c
      WHERE c."status" = 'published'
        AND c."archived_at" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "content_deliveries" d
          WHERE d."user_id" = ${userId}
            AND d."content_id" = c."id"
        )
      ORDER BY RANDOM()
      LIMIT 1
    `);
  }

  findRandomPublished(transaction: RepositoryClient) {
    return transaction.$queryRaw<DeliveryContent[]>(Prisma.sql`
      SELECT
        c."id",
        c."key",
        c."text",
        c."format",
        c."language_code" AS "languageCode"
      FROM "contents" c
      WHERE c."status" = 'published'
        AND c."archived_at" IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `);
  }
}
