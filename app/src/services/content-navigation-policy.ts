export type NextContentSource = 'local' | 'remote' | 'offline';

export function chooseNextSource(
  hasCachedNext: boolean,
  isOnline: boolean,
): NextContentSource {
  if (hasCachedNext) return 'local';
  return isOnline ? 'remote' : 'offline';
}
