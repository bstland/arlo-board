import { useEffect, useRef } from 'react';
import { useEditor } from '@/contexts/editor-context';
import { AUTO_SAVE_DELAY_MS } from '@/lib/config';

export function useAutoSave() {
  const { state, saveFile } = useEditor();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!state.isDirty || !state.filePath) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveFile();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.content, state.isDirty, state.filePath, saveFile]);
}
