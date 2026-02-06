'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { EditorState, EditorAction } from '@/lib/types';
import { readFile, writeFile } from '@/lib/dropbox-client';

const initialState: EditorState = {
  content: '',
  originalContent: '',
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  viewMode: 'split',
  filePath: null,
  fileName: null,
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CONTENT':
      return {
        ...state,
        content: action.content,
        isDirty: action.content !== state.originalContent,
      };
    case 'SET_FILE':
      return {
        ...state,
        filePath: action.path,
        fileName: action.name,
        content: action.content,
        originalContent: action.content,
        isDirty: false,
        lastSaved: null,
      };
    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving };
    case 'SET_SAVED':
      return {
        ...state,
        isSaving: false,
        isDirty: false,
        originalContent: action.content,
        lastSaved: new Date(),
      };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };
    case 'CLOSE_FILE':
      return { ...initialState, viewMode: state.viewMode };
    default:
      return state;
  }
}

interface EditorContextType {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  openFile: (path: string) => Promise<void>;
  saveFile: () => Promise<void>;
  setContent: (content: string) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const openFile = useCallback(async (path: string) => {
    try {
      const { content, metadata } = await readFile(path);
      dispatch({ type: 'SET_FILE', path, name: metadata.name, content });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, []);

  const saveFile = useCallback(async () => {
    if (!state.filePath || !state.isDirty) return;
    dispatch({ type: 'SET_SAVING', isSaving: true });
    try {
      await writeFile(state.filePath, state.content);
      dispatch({ type: 'SET_SAVED', content: state.content });
    } catch (err) {
      console.error('Failed to save file:', err);
      dispatch({ type: 'SET_SAVING', isSaving: false });
    }
  }, [state.filePath, state.isDirty, state.content]);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', content });
  }, []);

  return (
    <EditorContext.Provider value={{ state, dispatch, openFile, saveFile, setContent }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
}
