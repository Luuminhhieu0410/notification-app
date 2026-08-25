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
      include: { content: true },
    });
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
      include: { content: true },
    });
  }

  create(
    data: Prisma.ContentDeliveryUncheckedCreateInput,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).contentDelivery.create({
      data,
      include: { content: true },
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
