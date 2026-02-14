'use client';

import { useEffect, useRef } from 'react';
import { FilePlus, FolderPlus, Pencil, Trash2, FolderInput } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  isFolder: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
}

export function ContextMenu({ x, y, isFolder, onClose, onNewFile, onNewFolder, onRename, onDelete, onMove }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const items = [
    ...(isFolder
      ? [
          { icon: FilePlus, label: 'New File', action: onNewFile },
          { icon: FolderPlus, label: 'New Folder', action: onNewFolder },
        ]
      : []),
    { icon: Pencil, label: 'Rename', action: onRename },
    { icon: FolderInput, label: 'Move to...', action: onMove },
    { icon: Trash2, label: 'Delete', action: onDelete, danger: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-[#313244] rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            item.danger ? 'text-red-500 hover:text-red-600' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <item.icon size={14} />
          {item.label}
        </button>
      ))}
    </div>
  );
}
