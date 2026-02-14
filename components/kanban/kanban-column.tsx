'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@/lib/types';
import { TaskCard } from './task-card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMN_META: Record<TaskStatus, { label: string; accent: string; icon: string }> = {
  backlog: { label: 'Backlog', accent: 'border-gray-500/50', icon: '📋' },
  todo:    { label: 'To Do',   accent: 'border-blue-500/50', icon: '📌' },
  doing:   { label: 'Doing',   accent: 'border-violet-500/50', icon: '⚡' },
  done:    { label: 'Done',    accent: 'border-green-500/50', icon: '✅' },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick: (task: Task) => void;
  onAddClick: () => void;
}

export function KanbanColumn({ status, tasks, onCardClick, onAddClick }: KanbanColumnProps) {
  const meta = COLUMN_META[status];

  return (
    <div className={cn(
      'flex flex-col min-w-[280px] w-[280px] lg:flex-1 lg:min-w-0 lg:w-auto',
      'bg-[var(--color-surface)] rounded-xl border-t-2',
      meta.accent,
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)]/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">{meta.icon}</span>
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{meta.label}</h3>
          <span className="text-xs text-gray-500 bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="p-1 rounded-md text-gray-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
          title={`Add task to ${meta.label}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] transition-colors duration-200',
              snapshot.isDraggingOver && 'bg-violet-500/5',
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onCardClick(task)}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-[80px] text-xs text-gray-600">
                No tasks
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
