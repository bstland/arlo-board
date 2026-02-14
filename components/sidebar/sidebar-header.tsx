'use client';

import { Search, FilePlus, FolderPlus, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface SidebarHeaderProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  onSearch: () => void;
}

export function SidebarHeader({ onNewFile, onNewFolder, onRefresh, onSearch }: SidebarHeaderProps) {
  return (
    <div className="p-3 border-b border-gray-200 dark:border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base font-bold text-[var(--color-primary)] dark:text-[#cba6f7] tracking-tight">
          Arlo Board
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-600"
            title="Refresh files"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onSearch}
          className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-gray-100 dark:bg-[var(--color-surface)] text-gray-600 dark:text-gray-500 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Search size={14} />
          <span>Search files…</span>
        </button>
        <button
          onClick={onNewFile}
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-600"
          title="New file (Ctrl+N)"
        >
          <FilePlus size={14} />
        </button>
        <button
          onClick={onNewFolder}
          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-600"
          title="New folder"
        >
          <FolderPlus size={14} />
        </button>
      </div>
    </div>
  );
}
