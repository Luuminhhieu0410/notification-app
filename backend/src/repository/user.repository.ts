import { Injectable } from '@nestjs/common';
import { PostgresService } from '@/shared/postgres/postgres.service';
import type { RepositoryClient } from './repository.types';

interface UpsertInstallationInput {
  installationId: string;
  timezone: string;
  locale: string;
  platform: string;
  deviceName: string | null;
  osVersion: string | null;
  appVersion: string | null;
}

interface NotificationCandidateInput {
  installedBefore: Date;
  localSendTime: Date;
  weekday: number;
  take: number;
  cursor?: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly postgresService: PostgresService) {}

  private client(transaction?: RepositoryClient) {
    return transaction ?? this.postgresService.getClient();
  }

  findById(id: string, transaction?: RepositoryClient) {
    return this.client(transaction).user.findUnique({
      where: { id },
      select: { id: true, timezone: true },
    });
  }

  findPushTarget(id: string, transaction?: RepositoryClient) {
    return this.client(transaction).user.findUnique({
      where: { id },
      select: { id: true, pushToken: true },
    });
  }

  upsertInstallation(
    data: UpsertInstallationInput,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).user.upsert({
      where: { installationId: data.installationId },
      create: data,
      update: {
        timezone: data.timezone,
        locale: data.locale,
        platform: data.platform,
        deviceName: data.deviceName,
        osVersion: data.osVersion,
        appVersion: data.appVersion,
      },
    });
  }

  async assignPushToken(
    userId: string,
    pushToken: string,
    transaction?: RepositoryClient,
  ) {
    const client = this.client(transaction);
    await client.user.updateMany({
      where: { pushToken, id: { not: userId } },
      data: { pushToken: null },
    });
    return client.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  clearPushToken(userId: string, expectedToken: string) {
    return this.client().user.updateMany({
      where: { id: userId, pushToken: expectedToken },
      data: { pushToken: null },
    });
  }

  findNotificationCandidates(
    input: NotificationCandidateInput,
    transaction?: RepositoryClient,
  ) {
    return this.client(transaction).user.findMany({
      where: {
        installAt: { lt: input.installedBefore },
        notificationSettings: {
          is: {
            enabled: true,
            localSendTime: input.localSendTime,
            daysOfWeek: { has: input.weekday },
          },
        },
        pushToken: { not: null },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: input.take,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
  }
}
