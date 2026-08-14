import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryNotificationsProducer } from '@/queue/delivery-noti-queue/delivery-notifications.producer';
import { UserRepository } from '@/repository/user.repository';
import { getLocalDate } from '@/helper/date/getLocalDate';

@Injectable()
export class DevtoolService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly deliveryNotificationsProducer: DeliveryNotificationsProducer,
  ) {}

  async sendTestNotification(userId: string) {
    const user = await this.userRepository.findById(userId);
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
