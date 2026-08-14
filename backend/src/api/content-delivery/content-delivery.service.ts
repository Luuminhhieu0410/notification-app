import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@/generated/prisma/client';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';
import { UserRepository } from '@/repository/user.repository';
import {
  ContentRepository,
  type DeliveryContent,
} from '@/repository/content.repository';
import { ContentDeliveryRepository } from '@/repository/content-delivery.repository';

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
  constructor(
    private readonly postgresService: PostgresService,
    private readonly userRepository: UserRepository,
    private readonly contentRepository: ContentRepository,
    private readonly contentDeliveryRepository: ContentDeliveryRepository,
  ) {}

  async getCurrent(userId: string) {
    const user = await this.requireUser(userId);
    const latest =
      await this.contentDeliveryRepository.findLatestForUser(userId);

    if (latest) return this.toResponse(latest);
    return this.createDelivery(user, new Date(), 'first_app_open');
  }

  async createNext(userId: string) {
    const user = await this.requireUser(userId);
    return this.createDelivery(user, new Date(), 'next_button');
  }

  async getOrCreateForPush(userId: string, localDate: string) {
    const user = await this.requireUser(userId);
    return this.createDelivery(user, new Date(), 'scheduled_push', localDate);
  }

  private async requireUser(userId: string): Promise<DeliveryUser> {
    const user = await this.userRepository.findById(userId);
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
        const existingDelivery =
          await this.contentDeliveryRepository.findLatestForUser(
            user.id,
            transaction,
          );
        if (existingDelivery) return existingDelivery;
      }

      // Check under the user lock so concurrent queue retries remain idempotent.
      if (reason === 'scheduled_push') {
        const existingPush =
          await this.contentDeliveryRepository.findScheduledPush(
            user.id,
            deliveryDateLocal,
            transaction,
          );
        if (existingPush) return existingPush;
      }

      let [content] = await this.contentRepository.findRandomUndelivered(
        user.id,
        transaction,
      );

      // Start a new rotation after this user has received every published item.
      if (!content) {
        [content] =
          await this.contentRepository.findRandomPublished(transaction);
      }
      if (!content) return null;

      const deliveredInApp = reason !== 'scheduled_push';
      return this.contentDeliveryRepository.create(
        {
          userId: user.id,
          contentId: content.id,
          status: deliveredInApp ? 'delivered' : 'scheduled',
          scheduledFor: now,
          deliveryDateLocal,
          deliveredAt: deliveredInApp ? now : null,
          contentSnapshot: content,
          metadata: { reason },
        },
        transaction,
      );
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
