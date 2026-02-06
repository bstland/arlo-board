'use client';

import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, highlightSpecialChars } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { useTheme } from '@/contexts/theme-context';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#1e1e2e',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '16px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#f8f9fa',
    color: '#999',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0ff',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f0f0ff',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#ddd6fe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#ddd6fe !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#7c3aed',
  },
}, { dark: false });

const darkThemeExt = EditorView.theme({
  '&': {
    height: '100%',
  },
  '.cm-content': {
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '16px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#181825',
    borderRight: '1px solid #313244',
  },
  '.cm-activeLine': {
    backgroundColor: '#1e1e2e',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1e1e2e',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#45475a !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#45475a !important',
  },
}, { dark: true });

function getExtensions(isDark: boolean, onChange: (content: string) => void): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightSpecialChars(),
    drawSelection(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    history(),
    highlightSelectionMatches(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...searchKeymap,
      indentWithTab,
    ]),
    ...(isDark
      ? [oneDark, darkThemeExt]
      : [syntaxHighlighting(defaultHighlightStyle, { fallback: true }), lightTheme]),
  ];
}

export function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { theme } = useTheme();

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: getExtensions(theme === 'dark', onChange),
      }),
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]); // Recreate on theme change

  // Update content when file changes (not on typing)
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
    />
  );
}
