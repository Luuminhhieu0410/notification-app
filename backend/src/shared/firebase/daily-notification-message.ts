import type { MulticastMessage } from 'firebase-admin/messaging';

export interface DailyNotificationPayload {
  deliveryId: string;
  deliveryDateLocal: string;
  content: {
    id: string;
    key: string;
    text: string;
    format: string;
    languageCode: string;
  };
  title?: string;
}

export function buildDailyNotificationMessage(
  tokens: string[],
  payload: DailyNotificationPayload,
): MulticastMessage {
  return {
    tokens,
    notification: {
      title: payload.title ?? 'Daily Noti',
      body: payload.content.text,
    },
    data: {
      type: 'daily_content',
      deliveryId: payload.deliveryId,
      contentId: payload.content.id,
      contentKey: payload.content.key,
      text: payload.content.text,
      format: payload.content.format,
      languageCode: payload.content.languageCode,
      deliveryDateLocal: payload.deliveryDateLocal,
    },
    android: {
      priority: 'high',
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
