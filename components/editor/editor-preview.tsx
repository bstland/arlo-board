'use client';

import { useEditor } from '@/contexts/editor-context';
import { useFileSystem } from '@/contexts/file-system-context';
import { MarkdownEditor } from './markdown-editor';
import { MarkdownPreview } from './markdown-preview';
import { Toolbar } from './toolbar';
import { useAutoSave } from '@/hooks/use-auto-save';
import { isTextFile, isImageFile } from '@/lib/utils';
import { FileText, Image as ImageIcon } from 'lucide-react';

function WelcomeScreen() {
  return (
    <div className="h-full flex items-center justify-center bg-white dark:bg-[var(--color-surface)]">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <FileText size={32} className="text-[var(--color-primary)]" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-700">Arlo Board</h2>
        <p className="text-sm text-gray-600 max-w-xs">
          Select a file from the sidebar to start editing.
          <br />
          Use <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+N</kbd> to create a new file.
        </p>
      </div>
    </div>
  );
}

export function EditorPreview() {
  const { state, setContent } = useEditor();
  const { selectFile } = useFileSystem();
  const editorState = useEditor();

  // Auto-save hook
  useAutoSave();

  if (!state.filePath) {
    return <WelcomeScreen />;
  }

  const handleNavigate = (path: string) => {
    selectFile(path);
    editorState.openFile(path);
  };

  return (
    <div className="h-full flex flex-col">
      <Toolbar />
      <div className="flex-1 overflow-hidden flex">
        {/* Editor pane */}
        {(state.viewMode === 'edit' || state.viewMode === 'split') && (
          <div className={`${state.viewMode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-[var(--color-border)]' : 'w-full'} h-full overflow-hidden`}>
            <MarkdownEditor
              content={state.content}
              onChange={setContent}
            />
          </div>
        )}

        {/* Preview pane */}
        {(state.viewMode === 'preview' || state.viewMode === 'split') && (
          <div className={`${state.viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-hidden bg-white dark:bg-[var(--color-surface)]`}>
            <MarkdownPreview
              content={state.content}
              basePath={state.filePath}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
