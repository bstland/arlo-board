'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/contexts/theme-context';
import { FileSystemProvider } from '@/contexts/file-system-context';
import { EditorProvider } from '@/contexts/editor-context';
import { ToastProvider } from '@/contexts/toast-context';
import { TaskProvider } from '@/contexts/task-context';
import { PipelineProvider } from '@/contexts/pipeline-context';
import { RevenueProvider } from '@/contexts/revenue-context';
import { WorkflowProvider } from '@/contexts/workflow-context';

const AppShell = dynamic(() => import('@/components/app-shell').then(m => ({ default: m.AppShell })), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[#1e1e2e]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-violet-900/30 flex items-center justify-center mx-auto animate-pulse">
          <span className="text-2xl">📝</span>
        </div>
        <p className="text-gray-400 text-sm">Loading Arlo Board…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <FileSystemProvider>
          <EditorProvider>
            <TaskProvider>
              <PipelineProvider>
                <RevenueProvider>
                  <WorkflowProvider>
                    <AppShell />
                  </WorkflowProvider>
                </RevenueProvider>
              </PipelineProvider>
            </TaskProvider>
          </EditorProvider>
        </FileSystemProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
