import type { Message } from 'firebase-admin/messaging';
import type { DeliveryContent } from '@/repository/content.repository';
import { HOUR } from '@/helper/time/delay';

export interface DailyNotificationPayload {
  deliveryId: string;
  deliveryDateLocal: string;
  hasPrevious: boolean;
  content: DeliveryContent;
  title?: string;
}

export function buildDailyNotificationMessage(
  token: string,
  payload: DailyNotificationPayload,
): Message {
  return {
    token,
    notification: {
      title: payload.title ?? 'Daily Noti',
      body: payload.content.text,
    },
    data: {
      type: 'daily_content',
      deliveryId: payload.deliveryId,
    },
    android: {
      priority: 'high',
      ttl: HOUR,
      notification: {
        channelId: 'daily-content',
        sound: 'default',
      },
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: 'default', contentAvailable: true } },
    },
  };
}
