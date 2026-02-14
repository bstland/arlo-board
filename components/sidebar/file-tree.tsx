'use client';

import { useEffect } from 'react';
import { useFileSystem } from '@/contexts/file-system-context';
import { FileTreeNode } from './file-tree-node';
import { TreeSkeleton } from '@/components/ui/skeleton';
import type { FileEntry } from '@/lib/types';

interface FileTreeProps {
  onNewFile: (folderPath: string) => void;
  onNewFolder: (folderPath: string) => void;
  onRename: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onMove: (entry: FileEntry) => void;
}

export function FileTree({ onNewFile, onNewFolder, onRename, onDelete, onMove }: FileTreeProps) {
  const { state, loadFolder } = useFileSystem();

  // Load root on mount
  useEffect(() => {
    loadFolder('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootEntries = state.tree[''] || [];
  const isLoading = state.loading.has('');

  if (isLoading && rootEntries.length === 0) {
    return <TreeSkeleton />;
  }

  if (state.error) {
    return (
      <div className="p-4 text-sm text-red-500">
        <p>Failed to load files</p>
        <p className="text-xs mt-1 text-gray-400">{state.error}</p>
        <button
          onClick={() => loadFolder('')}
          className="mt-2 text-xs text-violet-500 hover:text-violet-400 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rootEntries.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No files found
      </div>
    );
  }

  return (
    <div className="py-1">
      {rootEntries.map(entry => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          depth={0}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </div>
  );
}
