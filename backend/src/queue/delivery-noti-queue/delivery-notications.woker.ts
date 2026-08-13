import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  type DeliveryNotificationJobData,
  QUEUE_DELIVERY_NOTIFICATION,
} from '@/const/queue/notification-delivery';
import { DeliveryNotificationsProcessor } from '@/queue/delivery-noti-queue/delivery-notifications.processor';

@Injectable()
@Processor(QUEUE_DELIVERY_NOTIFICATION, {
  concurrency: 10,
  limiter: { max: 100, duration: 1_000 },
})
export class DeliveryNotificationsWorker extends WorkerHost {
  constructor(
    private readonly deliveryNotificationsProcessor: DeliveryNotificationsProcessor,
  ) {
    super();
  }
  async process(job: Job<DeliveryNotificationJobData>) {
    return this.deliveryNotificationsProcessor.handle(job);
  }
}
