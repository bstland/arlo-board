import { useEffect } from 'react';
import { useEditor } from '@/contexts/editor-context';

export function useKeyboardShortcuts({
  onToggleSidebar,
  onNewFile,
  onSearch,
}: {
  onToggleSidebar?: () => void;
  onNewFile?: () => void;
  onSearch?: () => void;
}) {
  const { saveFile, dispatch, state } = useEditor();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + S — Save
      if (mod && e.key === 's') {
        e.preventDefault();
        saveFile();
        return;
      }

      // Cmd/Ctrl + B — Toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Cmd/Ctrl + N — New file
      if (mod && e.key === 'n') {
        e.preventDefault();
        onNewFile?.();
        return;
      }

      // Cmd/Ctrl + P — Quick search
      if (mod && e.key === 'p') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // Cmd/Ctrl + \ — Toggle split view
      if (mod && e.key === '\\') {
        e.preventDefault();
        const modes: Array<'edit' | 'preview' | 'split'> = ['edit', 'split', 'preview'];
        const current = modes.indexOf(state.viewMode);
        dispatch({ type: 'SET_VIEW_MODE', mode: modes[(current + 1) % 3] });
        return;
      }

      // Cmd/Ctrl + Shift + P — Preview only
      if (mod && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW_MODE', mode: state.viewMode === 'preview' ? 'edit' : 'preview' });
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveFile, dispatch, state.viewMode, onToggleSidebar, onNewFile, onSearch]);
}
