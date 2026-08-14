export const QUEUE_DELIVERY_NOTIFICATION = 'QUEUE_DELIVERY_NOTIFICATION';
export const JOB_SEND_DAILY_NOTIFICATION = 'send-daily-notification';
export const MAX_ATTEMPTS_JOB = 5;
export interface DeliveryNotificationJobData {
  userId: string;
  deliveryDateLocal: string;
}
