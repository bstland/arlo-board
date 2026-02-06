import { IMAGE_LINK_TTL_MS } from './config';
import { getTemporaryLink } from './dropbox-client';

const linkCache = new Map<string, { url: string; expires: number }>();

export async function getImageLink(path: string): Promise<string> {
  const cached = linkCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;

  const url = await getTemporaryLink(path);
  linkCache.set(path, { url, expires: Date.now() + IMAGE_LINK_TTL_MS });
  return url;
}

export function clearImageCache(): void {
  linkCache.clear();
}
