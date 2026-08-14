import { Injectable, Logger } from '@nestjs/common';
import { DeliveryNotificationsProducer } from '@/queue/delivery-noti-queue/delivery-notifications.producer';
import { UserRepository } from '@/repository/user.repository';
import { getLocalDate } from '@/helper/date/getLocalDate';
import { SCHEDULER_TIMEZONE, USERS_PER_BATCH } from '@/const/cron';

@Injectable()
export class SendNotificationService {
  private readonly logger = new Logger(SendNotificationService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly producer: DeliveryNotificationsProducer,
  ) {}

  async scheduleNotifications(hour: number, now = new Date()) {
    const localDate = getLocalDate(now, SCHEDULER_TIMEZONE);
    const localMidnightUtc = new Date(`${localDate}T00:00:00+07:00`);
    const weekday = new Date(`${localDate}T00:00:00.000Z`).getUTCDay() || 7;
    const localSendTime = new Date(Date.UTC(1970, 0, 1, hour));
    let cursor: string | undefined;
    let enqueued = 0;

    do {
      const users = await this.userRepository.findNotificationCandidates({
        installedBefore: localMidnightUtc,
        localSendTime,
        weekday,
        take: USERS_PER_BATCH,
        cursor,
      });

      if (users.length === 0) break;
      await this.producer.enqueueUserJobs(
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
