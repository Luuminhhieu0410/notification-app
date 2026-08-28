import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import { PostgresService } from '@/shared/postgres/postgres.service';
import type { RepositoryClient } from './repository.types';

@Injectable()
export class ContentDeliveryRepository {
  constructor(private readonly postgresService: PostgresService) {}

  private client(transaction?: RepositoryClient) {
    return transaction ?? this.postgresService.getClient();
  }

  findLatestForUser(userId: string, transaction?: RepositoryClient) {
    return this.client(transaction).contentDelivery.findFirst({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findByIdForUser(
    userId: string,
    deliveryId: string,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.findFirst({
      where: { id: deliveryId, userId },
    });
  }

  findPreviousForUser(
    userId: string,
    cursor: { id: string; createdAt: Date },
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.findFirst({
      where: {
        userId,
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findNextForUser(
    userId: string,
    cursor: { id: string; createdAt: Date },
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.findFirst({
      where: {
        userId,
        OR: [
          { createdAt: { gt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { gt: cursor.id } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async hasPreviousForUser(
    userId: string,
    cursor: { id: string; createdAt: Date },
    transaction?: RepositoryClient,
  ) {
    const previous = await this.client(transaction).contentDelivery.findFirst({
      where: {
        userId,
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      },
      select: { id: true },
    });
    return Boolean(previous);
  }

  findScheduledPush(
    userId: string,
    deliveryDateLocal: Date,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.findFirst({
      where: {
        userId,
        deliveryDateLocal,
        metadata: { path: ['reason'], equals: 'scheduled_push' },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  create(
    data: Prisma.ContentDeliveryUncheckedCreateInput,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.create({
      data,
    });
  }

  update(id: string, data: Prisma.ContentDeliveryUpdateInput) {
    return this.client().contentDelivery.update({ where: { id }, data });
  }

  updateUnlessSent(id: string, data: Prisma.ContentDeliveryUpdateInput) {
    return this.client().contentDelivery.updateMany({
      where: { id, status: { not: 'sent' } },
      data,
    });
  }
}
export const CONTENTDELIVERY_STATUS = {
  FAILED: 'failed',
  SENT: 'sent',
};
