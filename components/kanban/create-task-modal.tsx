'use client';

import { useState } from 'react';
import type { TaskStatus, TaskPriority } from '@/lib/types';
import { Dialog } from '@/components/ui/dialog';
import { useTask } from '@/contexts/task-context';
import { useToast } from '@/contexts/toast-context';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ASSIGNEE_OPTIONS = [
  { value: '', label: 'Unassigned' },
  { value: 'Arlo', label: 'Arlo' },
  { value: 'Scott', label: 'Scott' },
];

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

export function CreateTaskModal({ open, onClose, defaultStatus = 'backlog' }: CreateTaskModalProps) {
  const { addTask } = useTask();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium' as TaskPriority,
    assignee_name: 'Arlo',
    due: todayLocal(),
  });

  // Reset form when modal opens with new default status
  const handleClose = () => {
    setForm({
      title: '',
      description: '',
      status: defaultStatus,
      priority: 'medium',
      assignee_name: 'Arlo',
      due: todayLocal(),
    });
    onClose();
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await addTask({
        title: form.title.trim(),
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        assignee_name: form.assignee_name || undefined,
        due: form.due || undefined,
      });
      addToast('Task created', 'success');
      handleClose();
    } catch {
      addToast('Failed to create task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-gray-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Dialog open={open} onClose={handleClose} title="New Task">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
            placeholder="What needs to be done?"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && form.title.trim()) handleCreate();
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
              className={inputCls}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
              className={inputCls}
            >
              {PRIORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className={cn(inputCls, 'resize-none')}
            placeholder="Optional description…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Assignee</label>
            <select
              value={form.assignee_name}
              onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))}
              className={inputCls}
            >
              {ASSIGNEE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input
              type="date"
              value={form.due}
              onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-[var(--color-surface)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:opacity-90 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Task
          </button>
        </div>
      </div>
    </Dialog>
  );
}
