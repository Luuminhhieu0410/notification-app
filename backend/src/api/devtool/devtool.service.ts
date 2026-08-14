import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@/repository/user.repository';
import { buildDailyNotificationMessage } from '@/shared/firebase/daily-notification-message';
import { ContentDeliveryService } from '@/api/content-delivery/content-delivery.service';
import { ContentDeliveryRepository } from '@/repository/content-delivery.repository';
import { FirebaseService } from '@/shared/firebase/firebase.service';

@Injectable()
export class DevtoolService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly contentDeliveryRepository: ContentDeliveryRepository,
    private readonly contentDeliveryService: ContentDeliveryService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async sendTestNotification(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const delivery = await this.contentDeliveryService.createNext(userId);
    const target = await this.userRepository.findPushTarget(userId);
    const pushToken = target?.pushToken;
    if (!pushToken) {
      await this.contentDeliveryRepository.update(delivery.deliveryId, {
        status: 'failed',
        failureReason: 'No push token',
      });
      return { sent: false };
    }

    const messageId = await this.firebaseService
      .getMessaging()
      .send(buildDailyNotificationMessage(pushToken, delivery));

    await this.contentDeliveryRepository.update(delivery.deliveryId, {
      status: 'sent',
      sentAt: new Date(),
      failureReason: null,
    });

    return { sent: true, messageId };
  }
}
