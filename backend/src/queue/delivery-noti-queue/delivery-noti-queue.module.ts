import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DeliveryNotificationsProducer } from '@/queue/delivery-noti-queue/delivery-notifications.producer';
import { DeliveryNotificationsWorker } from '@/queue/delivery-noti-queue/delivery-notications.woker';
import { DeliveryNotificationsProcessor } from '@/queue/delivery-noti-queue/delivery-notifications.processor';
import { QUEUE_DELIVERY_NOTIFICATION } from '@/const/queue/notification-delivery';
import { FirebaseModule } from '@/shared/firebase/firebase.module';
import { PostgresModule } from '@/shared/postgres/postgres.module';
import { ContentDeliveryModule } from '@/api/content-delivery/content-delivery.module';

@Module({
  imports: [
    FirebaseModule,
    PostgresModule,
    ContentDeliveryModule,
    BullModule.registerQueue({
      name: QUEUE_DELIVERY_NOTIFICATION,
    }),
  ],
  providers: [
    DeliveryNotificationsProcessor,
    DeliveryNotificationsProducer,
    DeliveryNotificationsWorker,
  ],
  exports: [DeliveryNotificationsProducer],
})
export class DeliveryNotiQueueModule {}
