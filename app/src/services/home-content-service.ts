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

async function requireBackendUserId() {
  const { getLocalUser } =
    await import('@/databases/repositories/user.repository');
  const user = await getLocalUser();
  if (!user?.backendUserId) throw new Error('User is not synchronized yet');
  return user.backendUserId;
}

async function requestDelivery(url: string, method: 'GET' | 'POST') {
  const userId = await requireBackendUserId();
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

export function loadHomeContent() {
  return requestDelivery(deliveryPath('current'), 'GET');
}

export function loadDelivery(deliveryId: string) {
  return requestDelivery(deliveryPath(deliveryId), 'GET');
}

export function goToPreviousContent(deliveryId: string) {
  return requestDelivery(deliveryPath(deliveryId, 'previous'), 'GET');
}

export function goToNextContent(deliveryId: string) {
  return requestDelivery(deliveryPath(deliveryId, 'next'), 'POST');
}
