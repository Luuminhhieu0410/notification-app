import { Module } from '@nestjs/common';
import { SendNotificationService } from './send-notification.service';
import { SendNotificationSchedule } from './send-notification.schedule';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { DeliveryNotiQueueModule } from '@/queue/delivery-noti-queue/delivery-noti-queue.module';

@Module({
  imports: [PostgresModule, DeliveryNotiQueueModule],
  providers: [SendNotificationService, SendNotificationSchedule],
})
export class SendNotificationModule {}
