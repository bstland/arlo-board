'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, MessageSquare, LayoutGrid, Mic, X, Loader2 } from 'lucide-react';
import { Dialog } from './ui/dialog';
import { globalSearch, type SearchResult } from '@/lib/search-client';
import { useFileSystem } from '@/contexts/file-system-context';
import { useEditor } from '@/contexts/editor-context';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: 'files' | 'board' | 'pipeline' | 'revenue' | 'workflows', itemId?: string) => void;
}

const TYPE_CONFIG = {
  task: {
    icon: LayoutGrid,
    label: 'Task',
    color: 'text-violet-500 bg-violet-500/10',
  },
  comment: {
    icon: MessageSquare,
    label: 'Comment',
    color: 'text-blue-500 bg-blue-500/10',
  },
  file: {
    icon: FileText,
    label: 'File',
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  pipeline: {
    icon: Mic,
    label: 'Pipeline',
    color: 'text-amber-500 bg-amber-500/10',
  },
};

export function GlobalSearch({ open, onClose, onNavigate }: GlobalSearchProps) {
  const { state: fsState } = useFileSystem();
  const { openFile } = useEditor();
  const { selectFile } = useFileSystem();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fileResults, setFileResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search files from the local file tree
  const searchFiles = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    const allFiles = Object.values(fsState.tree)
      .flat()
      .filter(e => e.type === 'file');
    
    return allFiles
      .filter(f => 
        f.name.toLowerCase().includes(lowerQuery) || 
        f.path.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10)
      .map(f => ({
        id: f.path,
        type: 'file' as const,
        title: f.name,
        snippet: f.path,
        matchField: 'name',
      }));
  }, [fsState.tree]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setFileResults([]);
      return;
    }

    // Immediately search local files
    setFileResults(searchFiles(query));

    // Debounce API search
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const apiResults = await globalSearch(query);
        setResults(apiResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchFiles]);

  // Combine and dedupe results
  const allResults = [...fileResults, ...results];
  
  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(allResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, allResults, selectedIndex]);

  // Clear state when closed
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setFileResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'file':
        selectFile(result.id);
        openFile(result.id);
        onNavigate('files');
        break;
      case 'task':
      case 'comment':
        // Navigate to board and highlight the task
        onNavigate('board', result.parentId || result.id);
        break;
      case 'pipeline':
        onNavigate('pipeline', result.id);
        break;
    }
    onClose();
  };

  const groupedResults = allResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {});

  return (
    <Dialog open={open} onClose={onClose} title="">
      <div className="relative -mt-4">
        {/* Search input */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, files, comments…"
            autoFocus
            className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-[#313244] bg-white dark:bg-[#1e1e2e] text-gray-900 dark:text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {loading && (
            <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          )}
          {!loading && query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Type at least 2 characters to search
            </p>
          ) : allResults.length === 0 && !loading ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No results found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="space-y-4">
              {(['file', 'task', 'comment', 'pipeline'] as const).map(type => {
                const items = groupedResults[type];
                if (!items?.length) return null;
                
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <Icon size={12} />
                      {config.label}s ({items.length})
                    </div>
                    <div className="space-y-0.5">
                      {items.map((result, idx) => {
                        const globalIdx = allResults.indexOf(result);
                        const isSelected = globalIdx === selectedIndex;
                        
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-md transition-colors',
                              isSelected 
                                ? 'bg-violet-500/10 dark:bg-violet-500/20' 
                                : 'hover:bg-gray-100 dark:hover:bg-[#313244]'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <span className={cn('p-1 rounded', config.color)}>
                                <Icon size={14} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {result.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {result.type === 'comment' && result.parentTitle && (
                                    <span className="text-violet-500">Task: {result.parentTitle} · </span>
                                  )}
                                  {result.snippet}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        {allResults.length > 0 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-[#313244] text-xs text-gray-400">
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#313244]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#313244]">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#313244]">Esc</kbd> Close</span>
          </div>
        )}
      </div>
    </Dialog>
  );
}
