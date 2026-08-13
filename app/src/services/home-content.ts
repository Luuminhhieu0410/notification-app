import {
  cacheContent,
  type CachedContent,
  getCurrentCachedContent,
  getNextCachedContent,
  getPreviousCachedContent,
  hasNextCachedContent,
  hasPreviousCachedContent,
} from '@/databases/repositories/content.repository';
import { supportsLocalDatabase } from '@/databases/initialize';
import { getLocalUser } from '@/databases/repositories/user.repository';
import { api } from '@/helpers/api';
import { createHomeContentService } from './home-content-service';

export const HOME_CONTENT_QUERY_KEY = ['local', 'current-content'] as const;
export const HOME_HISTORY_QUERY_KEY = ['local', 'content-history'] as const;

interface DeliveryResponse {
  deliveryId: string;
  deliveryDateLocal: string;
  content: {
    id: string;
    key: string | null;
    text: string;
    format: string;
    languageCode: string;
  };
}

async function requestAndCache(path: 'current' | 'next') {
  if (!supportsLocalDatabase()) {
    throw new Error('Content history is only available on mobile');
  }

  const user = await getLocalUser();
  if (!user?.backendUserId) throw new Error('User is not synchronized yet');

  const response = await api<DeliveryResponse>({
    url: `/content-delivery/${path}`,
    method: path === 'next' ? 'POST' : 'GET',
    params: { userId: user.backendUserId },
    options: { timeout: 10_000 },
  });
  if (!response.success || !response.data) {
    throw new Error(response.message ?? 'Failed to load content');
  }

  const delivery = response.data;
  await cacheContent({
    deliveryId: delivery.deliveryId,
    contentId: delivery.content.id,
    contentKey: delivery.content.key,
    text: delivery.content.text,
    format: delivery.content.format,
    languageCode: delivery.content.languageCode,
    deliveryDateLocal: delivery.deliveryDateLocal,
    source: 'api',
  });

  const cached = await getCurrentCachedContent();
  if (!cached) throw new Error('Failed to cache content');
  return cached;
}

const homeContentService = createHomeContentService({
  getCurrent: async () =>
    supportsLocalDatabase() ? getCurrentCachedContent() : null,
  getPrevious: async () =>
    supportsLocalDatabase() ? getPreviousCachedContent() : null,
  getNext: async () =>
    supportsLocalDatabase() ? getNextCachedContent() : null,
  hasNext: async () =>
    supportsLocalDatabase() ? hasNextCachedContent() : false,
  fetchCurrent: () => requestAndCache('current'),
  fetchNext: () => requestAndCache('next'),
});

export function loadHomeContent(isOnline: boolean) {
  return homeContentService.loadCurrent(isOnline);
}

export function goToPreviousContent() {
  return homeContentService.goPrevious();
}

export function goToNextContent(isOnline: boolean) {
  return homeContentService.goNext(isOnline);
}

export async function getHomeHistoryState() {
  if (!supportsLocalDatabase()) {
    return { hasPrevious: false, hasNext: false };
  }

  const [hasPrevious, hasNext] = await Promise.all([
    hasPreviousCachedContent(),
    hasNextCachedContent(),
  ]);
  return { hasPrevious, hasNext };
}

export type { CachedContent };
