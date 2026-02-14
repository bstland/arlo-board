'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Folder, FolderOpen, Loader2, Home } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { listFolder } from '@/lib/dropbox-client';
import { cn } from '@/lib/utils';
import { DROPBOX_ROOT_PATH } from '@/lib/config';
import type { FileEntry } from '@/lib/types';

interface FolderPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folderPath: string) => void;
  entryPath: string;
  entryName: string;
  entryType: 'file' | 'folder';
  isMoving?: boolean;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[] | null; // null = not loaded
  loading: boolean;
}

function toRelativePath(fullPath: string): string {
  const lowerFull = fullPath.toLowerCase();
  const lowerRoot = DROPBOX_ROOT_PATH.toLowerCase();
  if (lowerFull.startsWith(lowerRoot)) {
    return fullPath.slice(DROPBOX_ROOT_PATH.length) || '';
  }
  return fullPath;
}

function getParent(path: string): string {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '';
}

function isDescendantOf(path: string, ancestor: string): boolean {
  const normalized = path.toLowerCase();
  const normalizedAncestor = ancestor.toLowerCase();
  return normalized === normalizedAncestor || normalized.startsWith(normalizedAncestor + '/');
}

function FolderTreeItem({
  node,
  depth,
  selected,
  onSelect,
  onExpand,
  excludePath,
  excludeParent,
  isFolder,
}: {
  node: FolderNode;
  depth: number;
  selected: string;
  onSelect: (path: string) => void;
  onExpand: (path: string) => void;
  excludePath: string;
  excludeParent: string;
  isFolder: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Can't move to own parent (same location) or, for folders, to self/descendants
  const isSameParent = node.path === excludeParent;
  const isSelfOrDescendant = isFolder && isDescendantOf(node.path, excludePath);
  const isDisabled = isSameParent || isSelfOrDescendant;
  const isSelected = selected === node.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded && node.children === null) {
      onExpand(node.path);
    }
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    if (!isDisabled) {
      onSelect(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleSelect}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1.5 text-sm text-left transition-colors rounded-md',
          isDisabled
            ? 'text-gray-600 dark:text-gray-600 cursor-not-allowed'
            : isSelected
            ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
            : 'hover:bg-gray-100 dark:hover:bg-[var(--color-surface)] text-gray-700 dark:text-gray-700'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        disabled={isDisabled}
        title={isDisabled ? (isSameParent ? 'Already in this folder' : 'Cannot move into itself') : node.path || '/'}
      >
        <span onClick={handleToggle} className="shrink-0 flex items-center">
          {node.loading ? (
            <Loader2 size={14} className="animate-spin text-gray-600" />
          ) : (
            <ChevronRight
              size={14}
              className={cn(
                'transition-transform text-gray-600',
                expanded && 'rotate-90',
                (!node.children || node.children.length === 0) && !node.loading && 'invisible'
              )}
            />
          )}
        </span>
        {expanded ? (
          <FolderOpen size={16} className="shrink-0 text-amber-500" />
        ) : (
          <Folder size={16} className="shrink-0 text-amber-500/70" />
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {expanded && node.children && node.children.map(child => (
        <FolderTreeItem
          key={child.path}
          node={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
          onExpand={onExpand}
          excludePath={excludePath}
          excludeParent={excludeParent}
          isFolder={isFolder}
        />
      ))}
    </div>
  );
}

export function FolderPicker({ open, onClose, onSelect, entryPath, entryName, entryType, isMoving }: FolderPickerProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [rootLoading, setRootLoading] = useState(false);
  const [selected, setSelected] = useState<string>('');

  const parentPath = getParent(entryPath);

  // Load root folders on open
  useEffect(() => {
    if (!open) return;
    setSelected('');
    setRootLoading(true);
    listFolder('')
      .then(({ entries }) => {
        const folderEntries = entries
          .filter(e => e.type === 'folder')
          .map(e => ({
            name: e.name,
            path: toRelativePath(e.path),
            children: null,
            loading: false,
          }));
        setFolders(folderEntries);
      })
      .catch(() => {
        setFolders([]);
      })
      .finally(() => setRootLoading(false));
  }, [open]);

  const expandFolder = useCallback(async (path: string) => {
    // Mark as loading
    const updateNode = (nodes: FolderNode[]): FolderNode[] =>
      nodes.map(n => {
        if (n.path === path) return { ...n, loading: true };
        if (n.children) return { ...n, children: updateNode(n.children) };
        return n;
      });
    setFolders(prev => updateNode(prev));

    try {
      const { entries } = await listFolder(path);
      const children = entries
        .filter(e => e.type === 'folder')
        .map(e => ({
          name: e.name,
          path: toRelativePath(e.path),
          children: null,
          loading: false,
        }));

      const setChildren = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => {
          if (n.path === path) return { ...n, children, loading: false };
          if (n.children) return { ...n, children: setChildren(n.children) };
          return n;
        });
      setFolders(prev => setChildren(prev));
    } catch {
      const clearLoading = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => {
          if (n.path === path) return { ...n, children: [], loading: false };
          if (n.children) return { ...n, children: clearLoading(n.children) };
          return n;
        });
      setFolders(prev => clearLoading(prev));
    }
  }, []);

  const handleSubmit = () => {
    onSelect(selected);
  };

  // Root is always a valid target (unless it's the current parent)
  const rootIsParent = parentPath === '' || parentPath === '/';

  return (
    <Dialog open={open} onClose={onClose} title={`Move "${entryName}"`} className="max-w-md">
      <p className="text-xs text-gray-500 dark:text-gray-600 mb-3">
        Select a destination folder:
      </p>

      <div className="border border-gray-200 dark:border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto p-1">
          {/* Root option */}
          <button
            onClick={() => !rootIsParent && setSelected('')}
            disabled={rootIsParent}
            className={cn(
              'flex items-center gap-1.5 w-full px-2 py-1.5 text-sm text-left transition-colors rounded-md',
              rootIsParent
                ? 'text-gray-600 dark:text-gray-600 cursor-not-allowed'
                : selected === ''
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'hover:bg-gray-100 dark:hover:bg-[var(--color-surface)] text-gray-700 dark:text-gray-700'
            )}
            title={rootIsParent ? 'Already in this folder' : 'Root folder'}
          >
            <span className="shrink-0 w-[14px]" />
            <Home size={16} className="shrink-0 text-[var(--color-primary)]" />
            <span className="truncate font-medium">/ (root)</span>
          </button>

          {rootLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-600" />
            </div>
          ) : (
            folders.map(folder => (
              <FolderTreeItem
                key={folder.path}
                node={folder}
                depth={0}
                selected={selected}
                onSelect={setSelected}
                onExpand={expandFolder}
                excludePath={entryPath}
                excludeParent={parentPath}
                isFolder={entryType === 'folder'}
              />
            ))
          )}
        </div>
      </div>

      {selected !== null && (
        <p className="text-xs text-gray-500 dark:text-gray-600 mt-2 truncate">
          Destination: <span className="font-mono text-gray-700 dark:text-gray-700">{selected || '/'}</span>
        </p>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isMoving || selected === null}
          className={cn(
            'px-4 py-2 text-sm rounded-lg text-white transition-colors',
            isMoving
              ? 'bg-violet-400 cursor-not-allowed'
              : 'bg-[var(--color-accent)] hover:opacity-90'
          )}
        >
          {isMoving ? (
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Moving...
            </span>
          ) : (
            'Move here'
          )}
        </button>
      </div>
    </Dialog>
  );
}
