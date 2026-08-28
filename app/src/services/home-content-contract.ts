export function deliveryPath(cursor: string, direction?: 'previous' | 'next') {
  if (cursor === 'current') return '/content-delivery/current';
  if (!direction) return `/content-delivery/${cursor}`;
  return `/content-delivery/${cursor}/${direction}`;
}

export function buildShareMessage(text: string, authorName: string | null) {
  return authorName ? `${text}\n\n— ${authorName}` : text;
}
