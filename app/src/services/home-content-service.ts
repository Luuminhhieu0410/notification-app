import { api } from '@/helpers/api';
import { deliveryPath } from './home-content-contract';

export { buildShareMessage, deliveryPath } from './home-content-contract';

export interface ContentTypeSummary {
  slug: string;
  name: string;
}

export interface AuthorSummary {
  id: string;
  slug: string;
  name: string;
}

export interface DeliveryContent {
  id: string;
  key: string;
  text: string;
  languageCode: string;
  contentType: ContentTypeSummary;
  author: AuthorSummary | null;
}

export interface DeliveryResponse {
  deliveryId: string;
  deliveryDateLocal: string;
  hasPrevious: boolean;
  content: DeliveryContent;
}

export const HOME_CONTENT_QUERY_KEY = ['remote', 'current-content'] as const;

async function requestDelivery(
  userId: string,
  url: string,
  method: 'GET' | 'POST',
) {
  const response = await api<DeliveryResponse>({
    url,
    method,
    params: { userId },
    options: { timeout: 10_000 },
  });
  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Failed to load content');
  }
  return response.data;
}

export function loadHomeContent(userId: string) {
  return requestDelivery(userId, deliveryPath('current'), 'GET');
}

export function loadDelivery(userId: string, deliveryId: string) {
  return requestDelivery(userId, deliveryPath(deliveryId), 'GET');
}

export function goToPreviousContent(userId: string, deliveryId: string) {
  return requestDelivery(userId, deliveryPath(deliveryId, 'previous'), 'GET');
}

export function goToNextContent(userId: string, deliveryId: string) {
  return requestDelivery(userId, deliveryPath(deliveryId, 'next'), 'POST');
}
