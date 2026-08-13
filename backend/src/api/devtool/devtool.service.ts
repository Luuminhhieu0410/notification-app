import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryNotificationsProducer } from '@/queue/delivery-noti-queue/delivery-notifications.producer';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { getLocalDate } from '@/helper/date/getLocalDate';

@Injectable()
export class DevtoolService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly deliveryNotificationsProducer: DeliveryNotificationsProducer,
  ) {}

  async sendTestNotification(userId: string) {
    const user = await this.postgresService.getClient().user.findUnique({
      where: { id: userId },
      select: { id: true, timezone: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const deliveryDateLocal = getLocalDate(new Date(), user.timezone);
    const job = await this.deliveryNotificationsProducer.addTestJob(
      user.id,
      deliveryDateLocal,
    );

    return {
      queued: true,
      jobId: job.id,
      userId: user.id,
      deliveryDateLocal,
    };
  }
}
