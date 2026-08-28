import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type ContentDelivery, Prisma } from '@/generated/prisma/client';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';
import { UserRepository } from '@/repository/user.repository';
import {
  ContentRepository,
  type DeliveryContent,
} from '@/repository/content.repository';
import { ContentDeliveryRepository } from '@/repository/content-delivery.repository';
import type { RepositoryClient } from '@/repository/repository.types';

interface DeliveryUser {
  id: string;
  timezone: string;
}

type DeliveryReason = 'first_app_open' | 'next_button' | 'scheduled_push';

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
    if (latest) return this.toResponse(userId, latest);

    const delivery = await this.createDelivery(
      user,
      new Date(),
      'first_app_open',
    );
    return this.toResponse(userId, delivery);
  }

  async getById(userId: string, deliveryId: string) {
    await this.requireUser(userId);
    const delivery = await this.contentDeliveryRepository.findByIdForUser(
      userId,
      deliveryId,
    );
    if (!delivery) throw new NotFoundException('Content delivery not found');
    return this.toResponse(userId, delivery);
  }

  async getPrevious(userId: string, deliveryId: string) {
    await this.requireUser(userId);
    const cursor = await this.contentDeliveryRepository.findByIdForUser(
      userId,
      deliveryId,
    );
    if (!cursor) throw new NotFoundException('Content delivery not found');

    const previous = await this.contentDeliveryRepository.findPreviousForUser(
      userId,
      cursor,
    );
    return this.toResponse(userId, previous ?? cursor);
  }

  async getNext(userId: string, deliveryId: string) {
    const user = await this.requireUser(userId);
    const now = new Date();
    const deliveryDateLocal = this.parseLocalDate(
      getLocalDate(now, user.timezone),
    );
    const client = this.postgresService.getClient();

    const delivery = await client.$transaction(async (transaction) => {
      await this.lockUser(user.id, transaction);
      const cursor = await this.contentDeliveryRepository.findByIdForUser(
        user.id,
        deliveryId,
        transaction,
      );
      if (!cursor) throw new NotFoundException('Content delivery not found');

      const existingNext = await this.contentDeliveryRepository.findNextForUser(
        user.id,
        cursor,
        transaction,
      );
      if (existingNext) return existingNext;

      return this.createNewDelivery(
        user,
        now,
        deliveryDateLocal,
        'next_button',
        transaction,
      );
    });

    if (!delivery) this.noContent();
    return this.toResponse(user.id, delivery);
  }

  //
  async createNext(userId: string) {
    const user = await this.requireUser(userId);
    const delivery = await this.createDelivery(user, new Date(), 'next_button');
    return this.toResponse(user.id, delivery);
  }

  async getOrCreateForPush(userId: string, localDate: string) {
    const user = await this.requireUser(userId);
    const delivery = await this.createDelivery(
      user,
      new Date(),
      'scheduled_push',
      localDate,
    );
    return this.toResponse(user.id, delivery);
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
      await this.lockUser(user.id, transaction);

      if (reason === 'first_app_open') {
        const existingDelivery =
          await this.contentDeliveryRepository.findLatestForUser(
            user.id,
            transaction,
          );
        if (existingDelivery) return existingDelivery;
      }

      if (reason === 'scheduled_push') {
        const existingPush =
          await this.contentDeliveryRepository.findScheduledPush(
            user.id,
            deliveryDateLocal,
            transaction,
          );
        if (existingPush) return existingPush;
      }

      return this.createNewDelivery(
        user,
        now,
        deliveryDateLocal,
        reason,
        transaction,
      );
    });

    if (!delivery) this.noContent();
    return delivery;
  }

  private async createNewDelivery(
    user: DeliveryUser,
    now: Date,
    deliveryDateLocal: Date,
    reason: DeliveryReason,
    transaction: RepositoryClient,
  ) {
    let [content] = await this.contentRepository.findRandomUndelivered(
      user.id,
      transaction,
    );
    if (!content) {
      [content] = await this.contentRepository.findRandomPublished(transaction);
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
        contentSnapshot: content as unknown as Prisma.InputJsonValue,
        metadata: { reason },
      },
      transaction,
    );
  }

  private lockUser(userId: string, transaction: RepositoryClient) {
    return transaction.$queryRaw<{ lock: string }[]>(Prisma.sql`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${`content-delivery:${userId}`}, 0)
      )::text AS "lock"
    `);
  }

  private parseLocalDate(localDate: string) {
    return new Date(`${localDate}T00:00:00.000Z`);
  }

  private noContent(): never {
    throw new UnprocessableEntityException('No published content available');
  }

  private async toResponse(userId: string, delivery: ContentDelivery) {
    const content = this.parseSnapshot(delivery.contentSnapshot);
    const hasPrevious = await this.contentDeliveryRepository.hasPreviousForUser(
      userId,
      delivery,
    );
    return {
      deliveryId: delivery.id,
      deliveryDateLocal: delivery.deliveryDateLocal.toISOString().slice(0, 10),
      hasPrevious,
      content,
    };
  }

  private parseSnapshot(value: Prisma.JsonValue): DeliveryContent {
    if (!this.isRecord(value)) this.invalidSnapshot();
    const contentType = value.contentType;
    const author = value.author;
    if (
      typeof value.id !== 'string' ||
      typeof value.key !== 'string' ||
      typeof value.text !== 'string' ||
      typeof value.languageCode !== 'string' ||
      !this.isRecord(contentType) ||
      typeof contentType.slug !== 'string' ||
      typeof contentType.name !== 'string'
    ) {
      this.invalidSnapshot();
    }
    if (
      author !== null &&
      (!this.isRecord(author) ||
        typeof author.id !== 'string' ||
        typeof author.slug !== 'string' ||
        typeof author.name !== 'string')
    ) {
      this.invalidSnapshot();
    }

    const parsedAuthor =
      author === null
        ? null
        : {
            id: author.id as string,
            slug: author.slug as string,
            name: author.name as string,
          };

    return {
      id: value.id,
      key: value.key,
      text: value.text,
      languageCode: value.languageCode,
      contentType: { slug: contentType.slug, name: contentType.name },
      author: parsedAuthor,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private invalidSnapshot(): never {
    throw new InternalServerErrorException('Invalid content delivery snapshot');
  }
}
