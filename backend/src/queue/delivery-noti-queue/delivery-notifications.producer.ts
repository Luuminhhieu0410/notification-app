import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import {
  type DeliveryNotificationJobData,
  JOB_SEND_DAILY_NOTIFICATION,
  MAX_ATTEMPTS_JOB,
  QUEUE_DELIVERY_NOTIFICATION,
} from '@/const/queue/notification-delivery';

@Injectable()
export class DeliveryNotificationsProducer {
  constructor(
    @InjectQueue(QUEUE_DELIVERY_NOTIFICATION)
    private readonly queue: Queue<DeliveryNotificationJobData>,
  ) {}

  enqueueUserJobs(userIds: string[], deliveryDateLocal: string) {
    return this.queue.addBulk(
      userIds.map((userId) => ({
        name: JOB_SEND_DAILY_NOTIFICATION,
        data: { userId, deliveryDateLocal },
        opts: this.jobOptions(`daily-push-${deliveryDateLocal}-${userId}`),
      })),
    );
  }

  addTestJob(userId: string, deliveryDateLocal: string) {
    return this.queue.add(
      JOB_SEND_DAILY_NOTIFICATION,
      { userId, deliveryDateLocal },
      this.jobOptions(
        `devtool-daily-push-${deliveryDateLocal}-${userId}-${randomUUID()}`,
      ),
    );
  }

  private jobOptions(jobId: string) {
    return {
      jobId,
      attempts: MAX_ATTEMPTS_JOB,
      backoff: { type: 'exponential' as const, delay: 30_000 },
      removeOnComplete: { age: 24 * 60 * 60 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    };
  }
}
