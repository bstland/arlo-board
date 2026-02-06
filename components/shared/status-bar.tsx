'use client';

import { useEditor } from '@/contexts/editor-context';
import { formatFileSize, formatRelativeTime } from '@/lib/utils';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export function StatusBar() {
  const { state } = useEditor();

  return (
    <div className="h-7 bg-gray-100 dark:bg-[#181825] border-t border-gray-200 dark:border-[#313244] px-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 shrink-0">
      <div className="flex items-center gap-3">
        {state.filePath && (
          <span className="truncate max-w-[300px]">{state.filePath}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {state.isSaving && (
          <span className="flex items-center gap-1 text-blue-500">
            <Loader2 size={12} className="animate-spin" />
            Saving…
          </span>
        )}
        {!state.isSaving && state.isDirty && (
          <span className="flex items-center gap-1 text-amber-500">
            <AlertCircle size={12} />
            Unsaved changes
          </span>
        )}
        {!state.isSaving && !state.isDirty && state.lastSaved && (
          <span className="flex items-center gap-1 text-green-500">
            <Check size={12} />
            Saved {formatRelativeTime(state.lastSaved.toISOString())}
          </span>
        )}
        {state.viewMode && (
          <span className="uppercase tracking-wide">{state.viewMode}</span>
        )}
      </div>
    </div>
  );
}
