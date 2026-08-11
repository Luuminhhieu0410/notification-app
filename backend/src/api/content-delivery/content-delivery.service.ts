import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';

@Injectable()
export class ContentDeliveryService {
  constructor(private readonly postgresService: PostgresService) {}

  async getOrCreateToday(userId: string) {
    const client = this.postgresService.getClient();
    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const localDate = getLocalDate(now, user.timezone);
    const deliveryDateLocal = new Date(`${localDate}T00:00:00.000Z`);

    const delivery = await client.$transaction(async (transaction) => {
      const existing = await transaction.contentDelivery.findUnique({
        where: {
          userId_deliveryDateLocal_channel: {
            userId,
            deliveryDateLocal,
            channel: 'in_app',
          },
        },
        include: { content: true },
      });
      if (existing) return existing;

      const contentWhere = { status: 'published', archivedAt: null } as const;
      const contentCount = await transaction.content.count({
        where: contentWhere,
      });
      if (contentCount === 0) return null;

      const randomOffset = Math.floor(Math.random() * contentCount);
      const content = await transaction.content.findFirst({
        where: contentWhere,
        orderBy: { id: 'asc' },
        skip: randomOffset,
      });
      if (!content) return null;

      return transaction.contentDelivery.upsert({
        where: {
          userId_deliveryDateLocal_channel: {
            userId,
            deliveryDateLocal,
            channel: 'in_app',
          },
        },
        create: {
          userId,
          contentId: content.id,
          channel: 'in_app',
          status: 'delivered',
          scheduledFor: now,
          deliveryDateLocal,
          deliveredAt: now,
          contentSnapshot: {
            id: content.id,
            key: content.key,
            text: content.text,
            format: content.format,
            languageCode: content.languageCode,
          },
          metadata: { reason: 'first_app_open' },
        },
        update: {},
        include: { content: true },
      });
    });

    if (!delivery) {
      throw new UnprocessableEntityException('No published content available');
    }

    return {
      deliveryId: delivery.id,
      deliveryDateLocal: localDate,
      channel: delivery.channel,
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
