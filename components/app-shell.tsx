'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './sidebar/sidebar';
import { EditorPreview } from './editor/editor-preview';
import { StatusBar } from './shared/status-bar';
import { ToastContainer } from './ui/toast';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFileSystem } from '@/contexts/file-system-context';
import { useEditor } from '@/contexts/editor-context';
import { isImageFile } from '@/lib/utils';
import { ImageGallery } from './gallery/image-gallery';
import { KanbanBoard } from './kanban/kanban-board';
import { PipelineBoard } from './pipeline/pipeline-board';
import { RevenueDashboard } from './revenue/revenue-dashboard';
import { WorkflowCanvas } from './workflow/workflow-canvas';
import { GlobalSearch } from './global-search';
import { Menu, X, FolderOpen, LayoutGrid, DollarSign, Mic, GitBranch, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'files' | 'board' | 'pipeline' | 'revenue' | 'workflows';

const NAV_TABS: { key: ViewMode; label: string; icon: typeof FolderOpen }[] = [
  { key: 'files', label: 'Files', icon: FolderOpen },
  { key: 'board', label: 'Board', icon: LayoutGrid },
  { key: 'pipeline', label: 'Pipeline', icon: Mic },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'workflows', label: 'Workflows', icon: GitBranch },
];

export function AppShell() {
  const [viewMode, setViewMode] = useState<ViewMode>('files');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const { state: fsState } = useFileSystem();
  const { state: editorState } = useEditor();

  // Check if current selection is an image file or an image folder
  const currentPath = fsState.currentPath;
  const selectedIsImage = currentPath && isImageFile(currentPath);
  
  // Check parent folder for gallery when an image is selected
  const parentPath = currentPath ? currentPath.substring(0, currentPath.lastIndexOf('/')) || '' : null;
  const parentEntries = parentPath !== null ? fsState.tree[parentPath] : null;
  const currentEntries = currentPath ? fsState.tree[currentPath] : null;
  
  // Gallery images: from parent folder if image file selected, or from current folder if it's a folder
  const imageEntries = selectedIsImage && parentEntries
    ? parentEntries.filter(e => e.type === 'file' && isImageFile(e.name))
    : currentEntries?.filter(e => e.type === 'file' && isImageFile(e.name)) || [];
  
  // Show gallery when: image file selected, OR folder with images selected and no text file open
  const showGallery = selectedIsImage || (currentPath && !editorState.filePath && imageEntries.length > 0);

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);

  useKeyboardShortcuts({
    onToggleSidebar: toggleSidebar,
    onNewFile: () => {}, // Handled inside sidebar
    onSearch: () => setSearchOpen(true),
  });

  const isFiles = viewMode === 'files';

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#1e1e2e] text-gray-900 dark:text-gray-100">
      {/* Top nav bar */}
      <div className="h-11 bg-gray-50 dark:bg-[#181825] border-b border-gray-200 dark:border-[#313244] px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              isFiles ? 'lg:hidden' : 'hidden', // Only show for files view on mobile
            )}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm font-bold text-violet-600 dark:text-[#cba6f7] select-none">Arlo Board</span>
        </div>

        {/* Center tabs */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="flex items-center bg-gray-200/50 dark:bg-[#1e1e2e] rounded-lg p-0.5 max-[400px]:overflow-x-auto max-[400px]:max-w-full max-[400px]:px-1">
          {NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = viewMode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-white dark:bg-[#313244] text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
                )}
              >
                <Icon size={13} />
                <span className="sr-only sm:not-sr-only">{tab.label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-[#313244] transition-colors shrink-0"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-1 px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-[#313244] rounded">⌘K</kbd>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — only show in files view */}
        {isFiles && (
          <>
            <div
              className={cn(
                'shrink-0 border-r border-gray-200 dark:border-[#313244] transition-all duration-200',
                'hidden lg:block',
                sidebarOpen ? 'lg:w-72' : 'lg:w-0 lg:border-r-0 lg:overflow-hidden',
              )}
            >
              <Sidebar onSearch={() => setSearchOpen(true)} />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-40 flex" style={{ top: '44px' }}>
                <div className="w-72 h-full shadow-xl z-10">
                  <Sidebar onSearch={() => { setSearchOpen(true); setSidebarOpen(false); }} />
                </div>
                <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
              </div>
            )}
          </>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {viewMode === 'files' ? (
            showGallery ? (
              <ImageGallery images={imageEntries} />
            ) : (
              <EditorPreview />
            )
          ) : viewMode === 'board' ? (
            <KanbanBoard />
          ) : viewMode === 'pipeline' ? (
            <PipelineBoard />
          ) : viewMode === 'revenue' ? (
            <RevenueDashboard />
          ) : (
            <WorkflowCanvas />
          )}
        </div>
      </div>

      {isFiles && <StatusBar />}
      <ToastContainer />
      <GlobalSearch 
        open={searchOpen} 
        onClose={() => setSearchOpen(false)} 
        onNavigate={(view, itemId) => {
          setViewMode(view);
          // TODO: Could pass itemId to highlight specific item
        }}
      />
    </div>
  );
}
