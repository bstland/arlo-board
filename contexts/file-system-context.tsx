'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { FileSystemState, FileSystemAction, FileEntry } from '@/lib/types';
import { listFolder } from '@/lib/dropbox-client';
import { DROPBOX_ROOT_PATH } from '@/lib/config';

const initialState: FileSystemState = {
  tree: {},
  currentPath: null,
  expandedFolders: new Set<string>(),
  loading: new Set<string>(),
  error: null,
};

function fileSystemReducer(state: FileSystemState, action: FileSystemAction): FileSystemState {
  switch (action.type) {
    case 'SET_TREE':
      return { ...state, tree: { ...state.tree, [action.path]: action.entries } };
    case 'SET_CURRENT_PATH':
      return { ...state, currentPath: action.path };
    case 'TOGGLE_FOLDER': {
      const expanded = new Set(state.expandedFolders);
      if (expanded.has(action.path)) {
        expanded.delete(action.path);
      } else {
        expanded.add(action.path);
      }
      return { ...state, expandedFolders: expanded };
    }
    case 'EXPAND_FOLDER': {
      const expanded = new Set(state.expandedFolders);
      expanded.add(action.path);
      return { ...state, expandedFolders: expanded };
    }
    case 'SET_LOADING': {
      const loading = new Set(state.loading);
      if (action.loading) {
        loading.add(action.path);
      } else {
        loading.delete(action.path);
      }
      return { ...state, loading };
    }
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'REMOVE_ENTRY': {
      const parentEntries = state.tree[action.parentPath] || [];
      return {
        ...state,
        tree: {
          ...state.tree,
          [action.parentPath]: parentEntries.filter(e => e.path !== action.path),
        },
        currentPath: state.currentPath === action.path ? null : state.currentPath,
      };
    }
    case 'ADD_ENTRY': {
      const parentEntries = state.tree[action.parentPath] || [];
      const newEntries = [...parentEntries, action.entry].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });
      return {
        ...state,
        tree: { ...state.tree, [action.parentPath]: newEntries },
      };
    }
    case 'RENAME_ENTRY': {
      const parentEntries = state.tree[action.parentPath] || [];
      return {
        ...state,
        tree: {
          ...state.tree,
          [action.parentPath]: parentEntries.map(e =>
            e.path === action.oldPath ? { ...e, path: action.newPath, name: action.newName } : e
          ),
        },
        currentPath: state.currentPath === action.oldPath ? action.newPath : state.currentPath,
      };
    }
    default:
      return state;
  }
}

interface FileSystemContextType {
  state: FileSystemState;
  loadFolder: (path: string) => Promise<void>;
  toggleFolder: (path: string) => Promise<void>;
  selectFile: (path: string) => void;
  refreshFolder: (path: string) => Promise<void>;
  dispatch: React.Dispatch<FileSystemAction>;
}

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export function FileSystemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(fileSystemReducer, initialState);

  // Strip root path prefix for display paths (case-insensitive since Dropbox is case-insensitive)
  const toRelativePath = useCallback((fullPath: string) => {
    const lowerFull = fullPath.toLowerCase();
    const lowerRoot = DROPBOX_ROOT_PATH.toLowerCase();
    if (lowerFull.startsWith(lowerRoot)) {
      return fullPath.slice(DROPBOX_ROOT_PATH.length) || '';
    }
    return fullPath;
  }, []);

  const loadFolder = useCallback(async (path: string) => {
    if (state.loading.has(path)) return;
    dispatch({ type: 'SET_LOADING', path, loading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      // path here is the relative path within our root
      const { entries } = await listFolder(path);
      // Normalize entry paths to be relative to root
      const normalizedEntries = entries.map(e => ({
        ...e,
        path: toRelativePath(e.path),
      }));
      dispatch({ type: 'SET_TREE', path, entries: normalizedEntries });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load folder' });
    } finally {
      dispatch({ type: 'SET_LOADING', path, loading: false });
    }
  }, [state.loading, toRelativePath]);

  const toggleFolder = useCallback(async (path: string) => {
    const isExpanded = state.expandedFolders.has(path);
    dispatch({ type: 'TOGGLE_FOLDER', path });
    if (!isExpanded && !state.tree[path]) {
      await loadFolder(path);
    }
  }, [state.expandedFolders, state.tree, loadFolder]);

  const selectFile = useCallback((path: string) => {
    dispatch({ type: 'SET_CURRENT_PATH', path });
  }, []);

  const refreshFolder = useCallback(async (path: string) => {
    await loadFolder(path);
  }, [loadFolder]);

  return (
    <FileSystemContext.Provider value={{ state, loadFolder, toggleFolder, selectFile, refreshFolder, dispatch }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) throw new Error('useFileSystem must be used within FileSystemProvider');
  return context;
}
