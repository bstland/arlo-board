import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { IMAGE_EXTENSIONS, MARKDOWN_EXTENSIONS, TEXT_EXTENSIONS } from './config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(getExtension(filename));
}

export function isMarkdownFile(filename: string): boolean {
  return MARKDOWN_EXTENSIONS.includes(getExtension(filename));
}

export function isTextFile(filename: string): boolean {
  return TEXT_EXTENSIONS.includes(getExtension(filename));
}

export function getParentPath(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '';
}

export function getFileName(path: string): string {
  return path.split('/').pop() || '';
}

export function sortEntries(entries: Array<{ type: string; name: string }>): typeof entries {
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
