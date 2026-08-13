import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type Content, Prisma } from '@/generated/prisma/client';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';

type DeliveryContent = Pick<
  Content,
  'id' | 'key' | 'text' | 'format' | 'languageCode'
>;

interface DeliveryUser {
  id: string;
  timezone: string;
}

type DeliveryReason = 'first_app_open' | 'next_button' | 'scheduled_push';

interface DeliveryWithContent {
  id: string;
  deliveryDateLocal: Date;
  content: DeliveryContent;
}

@Injectable()
export class ContentDeliveryService {
  constructor(private readonly postgresService: PostgresService) {}

  async getCurrent(userId: string) {
    const client = this.postgresService.getClient();
    const user = await this.requireUser(userId);
    const latest = await client.contentDelivery.findFirst({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { content: true },
    });

    if (latest) return this.toResponse(latest);
    return this.createDelivery(user, new Date(), 'first_app_open');
  }

  async createNext(userId: string) {
    const user = await this.requireUser(userId);
    return this.createDelivery(user, new Date(), 'next_button');
  }

  async getOrCreateForPush(userId: string, localDate: string) {
    const client = this.postgresService.getClient();
    const user = await this.requireUser(userId);
    const deliveryDateLocal = this.parseLocalDate(localDate);
    const existing = await client.contentDelivery.findFirst({
      where: {
        userId,
        deliveryDateLocal,
        metadata: { path: ['reason'], equals: 'scheduled_push' },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: { content: true },
    });

    if (existing) return this.toResponse(existing);
    return this.createDelivery(user, new Date(), 'scheduled_push', localDate);
  }

  private async requireUser(userId: string): Promise<DeliveryUser> {
    const client = this.postgresService.getClient();
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { id: true, timezone: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async createDelivery(
    user: DeliveryUser,
    now: Date,
    reason: DeliveryReason,
    requestedLocalDate?: string,
  ) {
    const client = this.postgresService.getClient();
    const localDate = requestedLocalDate ?? getLocalDate(now, user.timezone);
    const deliveryDateLocal = this.parseLocalDate(localDate);

    const delivery = await client.$transaction(async (transaction) => {
      await transaction.$queryRaw<{ lock: string }[]>(Prisma.sql`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${`content-delivery:${user.id}`}, 0)
        )::text AS "lock"
      `);

      if (reason === 'first_app_open') {
        const existingDelivery = await transaction.contentDelivery.findFirst({
          where: { userId: user.id },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: { content: true },
        });
        if (existingDelivery) return existingDelivery;
      }

      // The queue checks before opening the transaction for the common case,
      // then checks again under the user lock to make retries race-safe.
      if (reason === 'scheduled_push') {
        const existingPush = await transaction.contentDelivery.findFirst({
          where: {
            userId: user.id,
            deliveryDateLocal,
            metadata: { path: ['reason'], equals: 'scheduled_push' },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          include: { content: true },
        });
        if (existingPush) return existingPush;
      }

      let [content] = await transaction.$queryRaw<DeliveryContent[]>(Prisma.sql`
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
            WHERE d."user_id" = ${user.id}
              AND d."content_id" = c."id"
          )
        ORDER BY RANDOM()
        LIMIT 1
      `);

      // Start a new rotation after this user has received every published item.
      if (!content) {
        [content] = await transaction.$queryRaw<DeliveryContent[]>(Prisma.sql`
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
      if (!content) return null;

      const deliveredInApp = reason !== 'scheduled_push';
      return transaction.contentDelivery.create({
        data: {
          userId: user.id,
          contentId: content.id,
          status: deliveredInApp ? 'delivered' : 'scheduled',
          scheduledFor: now,
          deliveryDateLocal,
          deliveredAt: deliveredInApp ? now : null,
          contentSnapshot: content,
          metadata: { reason },
        },
        include: { content: true },
      });
    });

    if (!delivery) {
      throw new UnprocessableEntityException('No published content available');
    }
    return this.toResponse(delivery);
  }

  private parseLocalDate(localDate: string) {
    return new Date(`${localDate}T00:00:00.000Z`);
  }

  private toResponse(delivery: DeliveryWithContent) {
    return {
      deliveryId: delivery.id,
      deliveryDateLocal: delivery.deliveryDateLocal.toISOString().slice(0, 10),
      content: {
        id: delivery.content.id,
        key: delivery.content.key,
        text: delivery.content.text,
        format: delivery.content.format,
        languageCode: delivery.content.languageCode,
      },
    };
  }
}
