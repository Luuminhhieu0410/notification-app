import { Injectable } from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import type { RepositoryClient } from './repository.types';

export interface DeliveryContent {
  id: string;
  key: string;
  text: string;
  languageCode: string;
  contentType: { slug: string; name: string };
  author: { id: string; slug: string; name: string } | null;
}

interface DeliveryContentRow {
  id: string;
  key: string;
  text: string;
  languageCode: string;
  contentTypeSlug: string;
  contentTypeName: string;
  authorId: string | null;
  authorSlug: string | null;
  authorName: string | null;
}

@Injectable()
export class ContentRepository {
  async findRandomUndelivered(userId: string, transaction: RepositoryClient) {
    const rows = await transaction.$queryRaw<DeliveryContentRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."key",
        c."text",
        c."language_code" AS "languageCode",
        ct."slug" AS "contentTypeSlug",
        ct."name" AS "contentTypeName",
        a."id" AS "authorId",
        a."slug" AS "authorSlug",
        a."name" AS "authorName"
      FROM "contents" c
      JOIN "content_types" ct ON ct."id" = c."content_type_id"
      LEFT JOIN "authors" a ON a."id" = c."author_id"
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
    return rows.map((row) => this.mapDeliveryContent(row));
  }

  async findRandomPublished(transaction: RepositoryClient) {
    const rows = await transaction.$queryRaw<DeliveryContentRow[]>(Prisma.sql`
      SELECT
        c."id",
        c."key",
        c."text",
        c."language_code" AS "languageCode",
        ct."slug" AS "contentTypeSlug",
        ct."name" AS "contentTypeName",
        a."id" AS "authorId",
        a."slug" AS "authorSlug",
        a."name" AS "authorName"
      FROM "contents" c
      JOIN "content_types" ct ON ct."id" = c."content_type_id"
      LEFT JOIN "authors" a ON a."id" = c."author_id"
      WHERE c."status" = 'published'
        AND c."archived_at" IS NULL
      ORDER BY RANDOM()
      LIMIT 1
    `);
    return rows.map((row) => this.mapDeliveryContent(row));
  }

  private mapDeliveryContent(row: DeliveryContentRow): DeliveryContent {
    return {
      id: row.id,
      key: row.key,
      text: row.text,
      languageCode: row.languageCode,
      contentType: {
        slug: row.contentTypeSlug,
        name: row.contentTypeName,
      },
      author:
        row.authorId && row.authorSlug && row.authorName
          ? {
              id: row.authorId,
              slug: row.authorSlug,
              name: row.authorName,
            }
          : null,
    };
  }
}
