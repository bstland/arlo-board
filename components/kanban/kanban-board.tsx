'use client';

import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@/lib/types';
import { useTask } from '@/contexts/task-context';
import { KanbanColumn } from './kanban-column';
import { TaskModal } from './task-modal';
import { CreateTaskModal } from './create-task-modal';
import { Plus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'doing', 'done'];

export function KanbanBoard() {
  const { state, moveTask, loadTasks } = useTask();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('backlog');
  const [refreshing, setRefreshing] = useState(false);

  // Group tasks by status
  const columns = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      doing: [],
      done: [],
    };
    for (const task of state.tasks) {
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped.backlog.push(task); // fallback
      }
    }
    return grouped;
  }, [state.tasks]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;
    // Find current task to check if status actually changed
    const task = state.tasks.find(t => t.id === draggableId);
    if (task && task.status !== newStatus) {
      moveTask(draggableId, newStatus);
    }
  }, [state.tasks, moveTask]);

  const handleCardClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setEditOpen(true);
  }, []);

  const handleAddClick = useCallback((status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  // Loading state
  if (state.loading && state.tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-primary)] mx-auto" />
          <p className="text-sm text-gray-600">Loading tasks…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && state.tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{state.error}</p>
          <button
            onClick={handleRefresh}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Board header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Board</h2>
          <span className="text-xs text-gray-500">
            {state.tasks.length} task{state.tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-600 hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => handleAddClick('backlog')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:opacity-90 text-white transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full min-w-max lg:min-w-0">
            {COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={columns[status]}
                onCardClick={handleCardClick}
                onAddClick={() => handleAddClick(status)}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Modals */}
      <TaskModal
        task={selectedTask}
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedTask(null); }}
      />
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultStatus={createStatus}
      />
    </div>
  );
}
