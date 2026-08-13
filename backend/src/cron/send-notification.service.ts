import { Injectable, Logger } from '@nestjs/common';
import { DeliveryNotificationsProducer } from '@/queue/delivery-noti-queue/delivery-notifications.producer';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';
import { SCHEDULER_TIMEZONE, USERS_PER_BATCH } from '@/const/cron';

@Injectable()
export class SendNotificationService {
  private readonly logger = new Logger(SendNotificationService.name);

  constructor(
    private readonly postgresService: PostgresService,
    private readonly producer: DeliveryNotificationsProducer,
  ) {}

  async scheduleNotifications(hour: number, now = new Date()) {
    const client = this.postgresService.getClient();
    const localDate = getLocalDate(now, SCHEDULER_TIMEZONE);
    const localMidnightUtc = new Date(`${localDate}T00:00:00+07:00`);
    const weekday = new Date(`${localDate}T00:00:00.000Z`).getUTCDay() || 7;
    const localSendTime = new Date(Date.UTC(1970, 0, 1, hour));
    let cursor: string | undefined;
    let enqueued = 0;

    do {
      const users = await client.user.findMany({
        where: {
          installAt: { lt: localMidnightUtc },
          notificationSettings: {
            is: {
              enabled: true,
              localSendTime,
              daysOfWeek: { has: weekday },
            },
          },
          devices: { some: { enabled: true } },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
        take: USERS_PER_BATCH,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      if (users.length === 0) break;
      await this.producer.addBulkJobs(
        users.map(({ id }) => id),
        localDate,
      );
      enqueued += users.length;
      cursor = users.at(-1)?.id;

      if (users.length < USERS_PER_BATCH) break;
    } while (cursor);

    this.logger.log(
      `Enqueued ${enqueued} daily notifications for ${localDate} at ${hour}:00`,
    );
    return enqueued;
  }
}
