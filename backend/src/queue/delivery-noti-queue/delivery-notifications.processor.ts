import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import {
  DeliveryNotificationJobData,
  JOB_SEND_DAILY_NOTIFICATION,
} from '@/const/queue/notification-delivery';
import { ContentDeliveryService } from '@/api/content-delivery/content-delivery.service';
import { FirebaseService } from '@/shared/firebase/firebase.service';
import { buildDailyNotificationMessage } from '@/shared/firebase/daily-notification-message';
import { UserRepository } from '@/repository/user.repository';
import {
  CONTENTDELIVERY_STATUS,
  ContentDeliveryRepository,
} from '@/repository/content-delivery.repository';

@Injectable()
export class DeliveryNotificationsProcessor {
  private readonly logger = new Logger(DeliveryNotificationsProcessor.name);
  private RETRYABLE_CODES = new Set([
    'messaging/device-message-rate-exceeded',
    'messaging/message-rate-exceeded',
    'messaging/server-unavailable',
    'messaging/internal-error',
    'messaging/unknown-error',
  ]);
  private INVALID_TOKEN_CODES = new Set([
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
  ]);
  constructor(
    private readonly contentDeliveryService: ContentDeliveryService,
    private readonly firebaseService: FirebaseService,
    private readonly userRepository: UserRepository,
    private readonly contentDeliveryRepository: ContentDeliveryRepository,
  ) {}

  async handle(job: Job<DeliveryNotificationJobData>) {
    if (job.name !== JOB_SEND_DAILY_NOTIFICATION) {
      throw new UnrecoverableError(`Unsupported job: ${job.name}`);
    }

    const delivery = await this.contentDeliveryService.getOrCreateForPush(
      job.data.userId,
      job.data.deliveryDateLocal,
    );
    const target = await this.userRepository.findPushTarget(job.data.userId);
    const pushToken = target?.pushToken;
    if (!pushToken) {
      await this.contentDeliveryRepository.update(delivery.deliveryId, {
        status: CONTENTDELIVERY_STATUS.FAILED,
        failureReason: 'No push token',
      });
      return { sent: false };
    }

    try {
      const messageId = await this.firebaseService
        .getMessaging()
        .send(buildDailyNotificationMessage(pushToken, delivery));

      await this.contentDeliveryRepository.update(delivery.deliveryId, {
        status: CONTENTDELIVERY_STATUS.SENT,
        sentAt: new Date(),
        failureReason: null,
      });
      this.logger.log(`Delivery ${delivery.deliveryId} sent as ${messageId}`);
      return { sent: true, messageId };
    } catch (error) {
      const code = this.errorCode(error);
      const message = this.errorMessage(error);
      this.logger.error(
        `Error delivery notification: code=${code}, message=${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      const failureReason = this.errorMessage(error).slice(0, 2_000);

      if (this.INVALID_TOKEN_CODES.has(code)) {
        // console.log('clear token ');
        // await this.userRepository.clearPushToken(job.data.userId, pushToken);
        await this.contentDeliveryRepository.update(delivery.deliveryId, {
          status: CONTENTDELIVERY_STATUS.FAILED,
          failureReason,
        });
        throw new UnrecoverableError(failureReason);
      }

      if (this.RETRYABLE_CODES.has(code)) {
        if (this.isFinalAttempt(job)) {
          await this.contentDeliveryRepository.updateUnlessSent(
            delivery.deliveryId,
            {
              status: 'failed',
              failureReason,
            },
          );
        }
        throw error;
      }

      await this.contentDeliveryRepository.update(delivery.deliveryId, {
        status: 'failed',
        failureReason,
      });
      throw new UnrecoverableError(failureReason);
    }
  }

  private errorCode(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }
    return 'messaging/unknown-error';
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private isFinalAttempt(job: Job<DeliveryNotificationJobData>) {
    return job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
  }
}
