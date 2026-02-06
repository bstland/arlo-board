'use client';

import { useEditor } from '@/contexts/editor-context';
import { Check, AlertCircle, Loader2, PenLine, Eye, Columns, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toolbar() {
  const { state, dispatch, saveFile } = useEditor();

  if (!state.filePath) return null;

  const viewModes: { mode: 'edit' | 'preview' | 'split'; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
    { mode: 'edit', icon: PenLine, label: 'Edit' },
    { mode: 'split', icon: Columns, label: 'Split' },
    { mode: 'preview', icon: Eye, label: 'Preview' },
  ];

  return (
    <div className="h-10 bg-white dark:bg-[#1e1e2e] border-b border-gray-200 dark:border-[#313244] px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[300px]">
          {state.fileName}
        </span>

        {state.isSaving && (
          <span className="flex items-center gap-1 text-xs text-blue-500">
            <Loader2 size={12} className="animate-spin" />
            Saving…
          </span>
        )}
        {!state.isSaving && state.isDirty && (
          <button
            onClick={() => saveFile()}
            className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400"
          >
            <AlertCircle size={12} />
            Unsaved — click to save
          </button>
        )}
        {!state.isSaving && !state.isDirty && state.lastSaved && (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Check size={12} />
            Saved
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center bg-gray-100 dark:bg-[#313244] rounded-md p-0.5">
          {viewModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode })}
              className={cn(
                'px-2.5 py-1 text-xs rounded flex items-center gap-1.5 transition-colors',
                state.viewMode === mode
                  ? 'bg-white dark:bg-[#1e1e2e] text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title={label}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => dispatch({ type: 'CLOSE_FILE' })}
          className="ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
          title="Close file"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
