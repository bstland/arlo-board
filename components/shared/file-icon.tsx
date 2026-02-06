'use client';

import {
  FileText, FileImage, FileCode, File, FileJson,
  FolderOpen, Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  md: FileText,
  mdx: FileText,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
  json: FileJson,
  js: FileCode,
  ts: FileCode,
  tsx: FileCode,
  jsx: FileCode,
  css: FileCode,
  html: FileCode,
};

export function FileIcon({ extension, className }: { extension?: string; className?: string }) {
  const Icon = extension ? iconMap[extension] || File : File;
  return <Icon className={cn('shrink-0', className)} size={16} />;
}

export function FolderIcon({ open, className }: { open?: boolean; className?: string }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className={cn('shrink-0 text-amber-500', className)} size={16} />;
}
