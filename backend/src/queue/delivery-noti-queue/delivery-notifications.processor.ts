import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import {
  DeliveryNotificationJobData,
  JOB_SEND_DAILY_NOTIFICATION,
} from '@/const/queue/notification-delivery';
import type { BatchResponse } from 'firebase-admin/messaging';
import { ContentDeliveryService } from '@/api/content-delivery/content-delivery.service';
import { FirebaseService } from '@/shared/firebase/firebase.service';
import { PostgresService } from '@/shared/postgres/postgres.service';
import { buildDailyNotificationMessage } from '@/shared/firebase/daily-notification-message';

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
    private readonly postgresService: PostgresService,
  ) {}

  async handle(job: Job<DeliveryNotificationJobData>) {
    if (job.name !== JOB_SEND_DAILY_NOTIFICATION) {
      throw new UnrecoverableError(`Unsupported job: ${job.name}`);
    }

    const client = this.postgresService.getClient();
    const delivery = await this.contentDeliveryService.getOrCreateForPush(
      job.data.userId,
      job.data.deliveryDateLocal,
    );
    console.log('<<<', delivery);
    const devices = await client.userDevice.findMany({
      where: {
        userId: job.data.userId,
        enabled: true,
        ...(job.data.retryTokens
          ? { pushToken: { in: job.data.retryTokens } }
          : {}),
      },
      select: { pushToken: true },
    });
    const tokens = devices.map(({ pushToken }) => pushToken);
    if (tokens.length === 0) {
      await client.contentDelivery.update({
        where: { id: delivery.deliveryId },
        data: { status: 'failed', failureReason: 'No enabled push token' },
      });
      return { successCount: 0, failureCount: 0 };
    }

    let response: BatchResponse;
    try {
      response = await this.firebaseService
        .getMessaging()
        .sendEachForMulticast(buildDailyNotificationMessage(tokens, delivery));
    } catch (error) {
      const code = this.errorCode(error);
      if (this.RETRYABLE_CODES.has(code)) {
        if (this.isFinalAttempt(job)) {
          await client.contentDelivery.updateMany({
            where: { id: delivery.deliveryId, status: { not: 'sent' } },
            data: {
              status: 'failed',
              failureReason: this.errorMessage(error).slice(0, 2_000),
            },
          });
        }
        throw error;
      }
      await client.contentDelivery.update({
        where: { id: delivery.deliveryId },
        data: { status: 'failed', failureReason: this.errorMessage(error) },
      });
      throw new UnrecoverableError(this.errorMessage(error));
    }

    const invalidTokens: string[] = [];
    const retryTokens: string[] = [];
    const permanentErrors: string[] = [];
    response.responses.forEach((result, index) => {
      if (result.success) return;
      const code = this.errorCode(result.error);
      if (this.INVALID_TOKEN_CODES.has(code)) invalidTokens.push(tokens[index]);
      else if (this.RETRYABLE_CODES.has(code)) retryTokens.push(tokens[index]);
      else
        permanentErrors.push(`${code}: ${result.error?.message ?? 'unknown'}`);
    });

    if (invalidTokens.length > 0) {
      await client.userDevice.updateMany({
        where: { pushToken: { in: invalidTokens } },
        data: { enabled: false },
      });
    }

    if (response.successCount > 0) {
      await client.contentDelivery.update({
        where: { id: delivery.deliveryId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          failureReason: permanentErrors.length
            ? permanentErrors.join('\n').slice(0, 2_000)
            : null,
        },
      });
    }

    if (retryTokens.length > 0) {
      await job.updateData({ ...job.data, retryTokens });
      if (response.successCount === 0) {
        await client.contentDelivery.updateMany({
          where: { id: delivery.deliveryId, status: { not: 'sent' } },
          data: {
            status: this.isFinalAttempt(job) ? 'failed' : 'scheduled',
            failureReason:
              `Firebase temporarily rejected ${retryTokens.length} token(s)`.slice(
                0,
                2_000,
              ),
          },
        });
      }
      throw new Error(
        `Firebase temporarily rejected ${retryTokens.length} token(s)`,
      );
    }

    if (response.successCount === 0) {
      const failureReason =
        permanentErrors.join('\n') ||
        `${invalidTokens.length} invalid registration token(s)`;
      await client.contentDelivery.update({
        where: { id: delivery.deliveryId },
        data: {
          status: 'failed',
          failureReason: failureReason.slice(0, 2_000),
        },
      });
    }

    this.logger.log(
      `Delivery ${delivery.deliveryId}: ${response.successCount} sent, ${response.failureCount} failed`,
    );
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
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
