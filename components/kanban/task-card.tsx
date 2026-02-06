'use client';

import type { Task, TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, User, GripVertical, MessageCircle } from 'lucide-react';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  high:     { label: 'High',     color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
  medium:   { label: 'Medium',   color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  low:      { label: 'Low',      color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // Append T00:00:00 to date-only strings to force local timezone parsing (not UTC)
  const dueLocal = task.due && !task.due.includes('T') ? task.due + 'T00:00:00' : task.due;
  const isOverdue = dueLocal && new Date(dueLocal) < new Date() && task.status !== 'done';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 cursor-pointer',
        'hover:border-[#45475a] hover:bg-[#232336] transition-all duration-150',
        isDragging && 'shadow-xl shadow-violet-500/10 border-violet-500/40 rotate-[2deg] scale-105',
      )}
    >
      {/* Top: grip + priority badge */}
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className="text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-100 leading-snug line-clamp-2">
            {task.title}
          </h4>
        </div>
        <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0', priority.bg, priority.color)}>
          {priority.label}
        </span>
      </div>

      {/* Last activity snippet */}
      {task.last_activity && (
        <p className="text-xs text-gray-500 line-clamp-1 mb-2 ml-[22px]">
          {task.last_activity}
        </p>
      )}

      {/* Bottom: assignee + due */}
      <div className="flex items-center gap-3 ml-[22px]">
        {task.assignee_name && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <User size={11} />
            {task.assignee_name}
          </span>
        )}
        {dueLocal && (
          <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-400' : 'text-gray-500')}>
            {isOverdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
            {new Date(dueLocal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {(task.comment_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <MessageCircle size={11} />
            {task.comment_count}
          </span>
        )}
      </div>
    </div>
  );
}

export { PRIORITY_CONFIG };
