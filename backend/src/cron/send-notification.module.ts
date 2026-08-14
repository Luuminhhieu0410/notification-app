import { Module } from '@nestjs/common';
import { SendNotificationService } from './send-notification.service';
import { SendNotificationSchedule } from './send-notification.schedule';
import { RepositoryModule } from '@/repository/repository.module';
import { DeliveryNotiQueueModule } from '@/queue/delivery-noti-queue/delivery-noti-queue.module';

@Module({
  imports: [RepositoryModule, DeliveryNotiQueueModule],
  providers: [SendNotificationService, SendNotificationSchedule],
})
export class SendNotificationModule {}
