import { Injectable } from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';
import type { RepositoryClient } from './repository.types';

@Injectable()
export class NotificationSettingRepository {
  constructor(private readonly postgresService: PostgresService) {}

  private client(transaction?: RepositoryClient) {
    return transaction ?? this.postgresService.getClient();
  }

  upsertDefault(userId: string, transaction?: RepositoryClient) {
    return this.client(transaction).notificationSetting.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  upsertPreferences(
    userId: string,
    enabled: boolean,
    localSendTime: Date,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).notificationSetting.upsert({
      where: { userId },
      create: { userId, enabled, localSendTime },
      update: { enabled, localSendTime },
    });
  }
}
