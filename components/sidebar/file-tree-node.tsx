'use client';

import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useFileSystem } from '@/contexts/file-system-context';
import { useEditor } from '@/contexts/editor-context';
import { FileIcon, FolderIcon } from '@/components/shared/file-icon';
import { ContextMenu } from './context-menu';
import { cn, isTextFile, isImageFile } from '@/lib/utils';
import type { FileEntry } from '@/lib/types';

interface FileTreeNodeProps {
  entry: FileEntry;
  depth: number;
  onNewFile: (folderPath: string) => void;
  onNewFolder: (folderPath: string) => void;
  onRename: (entry: FileEntry) => void;
  onDelete: (entry: FileEntry) => void;
  onMove: (entry: FileEntry) => void;
}

export function FileTreeNode({ entry, depth, onNewFile, onNewFolder, onRename, onDelete, onMove }: FileTreeNodeProps) {
  const { state, toggleFolder, selectFile } = useFileSystem();
  const { openFile, state: editorState } = useEditor();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isExpanded = state.expandedFolders.has(entry.path);
  const isLoading = state.loading.has(entry.path);
  const children = state.tree[entry.path] || [];
  const isSelected = state.currentPath === entry.path;
  const isEditing = editorState.filePath === entry.path;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    if (entry.type === 'folder') {
      toggleFolder(entry.path);
    } else {
      selectFile(entry.path);
      if (isTextFile(entry.name)) {
        openFile(entry.path);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'flex items-center gap-1.5 w-full px-2 py-1 text-sm text-left transition-colors',
          'hover:bg-gray-100 dark:hover:bg-[var(--color-surface)] rounded-sm',
          isSelected && 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
          isEditing && !isSelected && 'bg-gray-50 dark:bg-gray-800/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        title={entry.path}
      >
        {entry.type === 'folder' && (
          isLoading ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-gray-600" />
          ) : (
            <ChevronRight
              size={14}
              className={cn('shrink-0 transition-transform text-gray-600', isExpanded && 'rotate-90')}
            />
          )
        )}
        {entry.type === 'folder' ? (
          <FolderIcon open={isExpanded} />
        ) : (
          <FileIcon extension={entry.extension} className="text-gray-600 ml-[14px]" />
        )}
        <span className="truncate">{entry.name}</span>
      </button>

      {entry.type === 'folder' && isExpanded && children.map(child => (
        <FileTreeNode
          key={child.path}
          entry={child}
          depth={depth + 1}
          onNewFile={onNewFile}
          onNewFolder={onNewFolder}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isFolder={entry.type === 'folder'}
          onClose={() => setContextMenu(null)}
          onNewFile={() => onNewFile(entry.type === 'folder' ? entry.path : entry.path.split('/').slice(0, -1).join('/'))}
          onNewFolder={() => onNewFolder(entry.type === 'folder' ? entry.path : entry.path.split('/').slice(0, -1).join('/'))}
          onRename={() => onRename(entry)}
          onDelete={() => onDelete(entry)}
          onMove={() => onMove(entry)}
        />
      )}
    </div>
  );
}
