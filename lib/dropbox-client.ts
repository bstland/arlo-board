// Client-side wrapper — calls our own API routes, never Dropbox directly
import type { FileEntry } from './types';
import { getExtension, sortEntries } from './utils';

export async function listFolder(path: string): Promise<{ entries: FileEntry[]; hasMore: boolean; cursor?: string }> {
  const res = await fetch('/api/files/list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to list folder' }));
    throw new Error(err.error || 'Failed to list folder');
  }
  const data = await res.json();
  const entries: FileEntry[] = data.entries.map((e: Record<string, unknown>) => ({
    name: e.name as string,
    path: e.path_display as string,
    type: (e['.tag'] as string) === 'folder' ? 'folder' : 'file',
    size: e.size as number | undefined,
    modified: (e.client_modified || e.server_modified) as string | undefined,
    extension: (e['.tag'] as string) !== 'folder' ? getExtension(e.name as string) : undefined,
  }));
  return {
    entries: sortEntries(entries) as FileEntry[],
    hasMore: data.has_more,
    cursor: data.cursor,
  };
}

export async function readFile(path: string): Promise<{ content: string; metadata: { name: string; size: number; modified: string } }> {
  const res = await fetch('/api/files/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to read file' }));
    throw new Error(err.error || 'Failed to read file');
  }
  return res.json();
}

export async function writeFile(path: string, content: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/files/write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to write file' }));
    throw new Error(err.error || 'Failed to write file');
  }
  return res.json();
}

export async function createFolder(path: string): Promise<{ success: boolean; metadata: { name: string; path: string } }> {
  const res = await fetch('/api/files/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create folder' }));
    throw new Error(err.error || 'Failed to create folder');
  }
  return res.json();
}

export async function deleteEntry(path: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/files/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
    throw new Error(err.error || 'Failed to delete');
  }
  return res.json();
}

export async function moveEntry(fromPath: string, toPath: string): Promise<{ success: boolean; metadata: { name: string; path: string } }> {
  const res = await fetch('/api/files/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromPath, toPath }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to move' }));
    throw new Error(err.error || 'Failed to move');
  }
  return res.json();
}

export async function getTemporaryLink(path: string): Promise<string> {
  const res = await fetch('/api/files/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to get link' }));
    throw new Error(err.error || 'Failed to get link');
  }
  const data = await res.json();
  return data.link;
}
