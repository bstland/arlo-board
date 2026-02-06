'use client';

import { useState, useCallback } from 'react';
import { SidebarHeader } from './sidebar-header';
import { FileTree } from './file-tree';
import { Dialog } from '@/components/ui/dialog';
import { useFileSystem } from '@/contexts/file-system-context';
import { useEditor } from '@/contexts/editor-context';
import { useToast } from '@/contexts/toast-context';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { writeFile, createFolder, deleteEntry, moveEntry } from '@/lib/dropbox-client';
import { getParentPath, getExtension, getFileName } from '@/lib/utils';
import { FolderPicker } from './folder-picker';
import type { FileEntry } from '@/lib/types';

interface SidebarProps {
  onSearch: () => void;
}

export function Sidebar({ onSearch }: SidebarProps) {
  const { refreshFolder, dispatch } = useFileSystem();
  const { state: editorState, dispatch: editorDispatch, openFile } = useEditor();
  const { addToast } = useToast();

  const [dialogType, setDialogType] = useState<'newFile' | 'newFolder' | 'rename' | 'delete' | 'move' | null>(null);
  const [dialogTarget, setDialogTarget] = useState<string>('');
  const [dialogEntry, setDialogEntry] = useState<FileEntry | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const handleNewFile = useCallback((folderPath?: string) => {
    setDialogType('newFile');
    setDialogTarget(folderPath || '');
    setInputValue('');
  }, []);

  const handleNewFolder = useCallback((folderPath?: string) => {
    setDialogType('newFolder');
    setDialogTarget(folderPath || '');
    setInputValue('');
  }, []);

  const handleRename = useCallback((entry: FileEntry) => {
    setDialogType('rename');
    setDialogEntry(entry);
    setInputValue(entry.name);
  }, []);

  const handleDelete = useCallback((entry: FileEntry) => {
    setDialogType('delete');
    setDialogEntry(entry);
  }, []);

  const handleMove = useCallback((entry: FileEntry) => {
    setDialogType('move');
    setDialogEntry(entry);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshFolder('');
    addToast('Files refreshed', 'success');
  }, [refreshFolder, addToast]);

  const closeDialog = () => {
    setDialogType(null);
    setDialogEntry(null);
    setInputValue('');
  };

  const submitNewFile = async () => {
    if (!inputValue.trim()) return;
    let name = inputValue.trim();
    if (!name.includes('.')) name += '.md';
    const path = dialogTarget ? `${dialogTarget}/${name}` : `/${name}`;
    try {
      await writeFile(path, '');
      const parentPath = dialogTarget || '';
      dispatch({
        type: 'ADD_ENTRY',
        parentPath,
        entry: {
          name,
          path,
          type: 'file',
          size: 0,
          extension: getExtension(name),
          modified: new Date().toISOString(),
        },
      });
      openFile(path);
      addToast(`Created ${name}`, 'success');
    } catch (err) {
      addToast(`Failed to create file: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
    closeDialog();
  };

  const submitNewFolder = async () => {
    if (!inputValue.trim()) return;
    const name = inputValue.trim();
    const path = dialogTarget ? `${dialogTarget}/${name}` : `/${name}`;
    try {
      await createFolder(path);
      const parentPath = dialogTarget || '';
      dispatch({
        type: 'ADD_ENTRY',
        parentPath,
        entry: { name, path, type: 'folder' },
      });
      addToast(`Created folder ${name}`, 'success');
    } catch (err) {
      addToast(`Failed to create folder: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
    closeDialog();
  };

  const submitRename = async () => {
    if (!inputValue.trim() || !dialogEntry) return;
    const parentPath = getParentPath(dialogEntry.path);
    const newPath = parentPath ? `${parentPath}/${inputValue.trim()}` : `/${inputValue.trim()}`;
    try {
      await moveEntry(dialogEntry.path, newPath);
      dispatch({
        type: 'RENAME_ENTRY',
        oldPath: dialogEntry.path,
        newPath,
        newName: inputValue.trim(),
        parentPath: parentPath || '',
      });
      if (editorState.filePath === dialogEntry.path) {
        openFile(newPath);
      }
      addToast(`Renamed to ${inputValue.trim()}`, 'success');
    } catch (err) {
      addToast(`Failed to rename: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
    closeDialog();
  };

  const submitDelete = async () => {
    if (!dialogEntry) return;
    try {
      await deleteEntry(dialogEntry.path);
      const parentPath = getParentPath(dialogEntry.path) || '';
      dispatch({ type: 'REMOVE_ENTRY', path: dialogEntry.path, parentPath });
      if (editorState.filePath === dialogEntry.path) {
        editorDispatch({ type: 'CLOSE_FILE' });
      }
      addToast(`Deleted ${dialogEntry.name}`, 'success');
    } catch (err) {
      addToast(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
    closeDialog();
  };

  const submitMove = async (destFolder: string) => {
    if (!dialogEntry) return;
    setIsMoving(true);
    const fileName = getFileName(dialogEntry.path);
    const newPath = destFolder ? `${destFolder}/${fileName}` : `/${fileName}`;
    const oldParent = getParentPath(dialogEntry.path) || '';
    try {
      await moveEntry(dialogEntry.path, newPath);
      // Remove from old parent
      dispatch({ type: 'REMOVE_ENTRY', path: dialogEntry.path, parentPath: oldParent });
      // Add to new parent if that folder is loaded in the tree
      const newParent = destFolder || '';
      dispatch({
        type: 'ADD_ENTRY',
        parentPath: newParent,
        entry: {
          ...dialogEntry,
          path: newPath,
          name: fileName,
        },
      });
      // If the moved file was open in editor, reopen at new path
      if (editorState.filePath === dialogEntry.path) {
        openFile(newPath);
      }
      addToast(`Moved ${fileName} to ${destFolder || '/'}`, 'success');
    } catch (err) {
      addToast(`Failed to move: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsMoving(false);
    }
    closeDialog();
  };

  const handleKeyDown = (e: React.KeyboardEvent, onSubmit: () => void) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#181825]">
      <SidebarHeader
        onNewFile={() => handleNewFile()}
        onNewFolder={() => handleNewFolder()}
        onRefresh={handleRefresh}
        onSearch={onSearch}
      />

      <div className="flex-1 overflow-y-auto">
        <FileTree
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      </div>

      <div className="p-2 border-t border-gray-200 dark:border-[#313244] flex items-center justify-between">
        <ThemeToggle />
        <span className="text-xs text-gray-400">Arlo Board v2</span>
      </div>

      {/* New File Dialog */}
      <Dialog open={dialogType === 'newFile'} onClose={closeDialog} title="New File">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => handleKeyDown(e, submitNewFile)}
          placeholder="filename.md"
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#313244] bg-white dark:bg-[#313244] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={submitNewFile} className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700">
            Create
          </button>
        </div>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={dialogType === 'newFolder'} onClose={closeDialog} title="New Folder">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => handleKeyDown(e, submitNewFolder)}
          placeholder="folder-name"
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#313244] bg-white dark:bg-[#313244] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={submitNewFolder} className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700">
            Create
          </button>
        </div>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={dialogType === 'rename'} onClose={closeDialog} title="Rename">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => handleKeyDown(e, submitRename)}
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#313244] bg-white dark:bg-[#313244] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={submitRename} className="px-4 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700">
            Rename
          </button>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={dialogType === 'delete'} onClose={closeDialog} title="Delete">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete <strong>{dialogEntry?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={closeDialog} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={submitDelete} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </Dialog>

      {/* Move Dialog */}
      {dialogEntry && (
        <FolderPicker
          open={dialogType === 'move'}
          onClose={closeDialog}
          onSelect={submitMove}
          entryPath={dialogEntry.path}
          entryName={dialogEntry.name}
          entryType={dialogEntry.type}
          isMoving={isMoving}
        />
      )}
    </div>
  );
}
