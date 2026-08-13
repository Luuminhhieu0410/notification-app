import type { CachedContent } from '@/databases/repositories/content.repository';
import { chooseNextSource } from './content-navigation-policy';

export interface HomeContentDependencies {
  getCurrent: () => Promise<CachedContent | null>;
  getPrevious: () => Promise<CachedContent | null>;
  getNext: () => Promise<CachedContent | null>;
  hasNext: () => Promise<boolean>;
  fetchCurrent: () => Promise<CachedContent>;
  fetchNext: () => Promise<CachedContent>;
}

export class OfflineNextError extends Error {
  constructor() {
    super('Internet connection is required for new content');
    this.name = 'OfflineNextError';
  }
}

export function createHomeContentService(deps: HomeContentDependencies) {
  return {
    async loadCurrent(isOnline: boolean) {
      if (!isOnline) return deps.getCurrent();

      try {
        return await deps.fetchCurrent();
      } catch {
        return deps.getCurrent();
      }
    },

    goPrevious() {
      return deps.getPrevious();
    },

    async goNext(isOnline: boolean) {
      const source = chooseNextSource(await deps.hasNext(), isOnline);
      if (source === 'offline') throw new OfflineNextError();

      const content =
        source === 'local' ? await deps.getNext() : await deps.fetchNext();
      return { content, source };
    },
  };
}
