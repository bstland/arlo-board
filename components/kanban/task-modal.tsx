'use client';

import { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, TaskComment } from '@/lib/types';
import { Dialog } from '@/components/ui/dialog';
import { PRIORITY_CONFIG } from './task-card';
import { useTask } from '@/contexts/task-context';
import { useToast } from '@/contexts/toast-context';
import { Trash2, Save, Loader2, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listComments, createComment } from '@/lib/comment-client';

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

interface TaskModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export function TaskModal({ task, open, onClose }: TaskModalProps) {
  const { editTask, removeTask } = useTask();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentAuthor, setCommentAuthor] = useState('Scott');
  const [commentBody, setCommentBody] = useState('');
  const [posting, setPosting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'backlog' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee_name: '',
    due: '',
    notes_path: '',
    last_activity: '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee_name: task.assignee_name || '',
        due: task.due ? task.due.slice(0, 10) : '',
        notes_path: task.notes_path || '',
        last_activity: task.last_activity || '',
      });
      // Load comments
      setLoadingComments(true);
      listComments(task.id)
        .then(setComments)
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    } else {
      setComments([]);
    }
    setConfirmDelete(false);
    setCommentBody('');
  }, [task]);

  // Scroll to bottom when comments update
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await editTask(task.id, {
        title: form.title.trim(),
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        assignee_name: form.assignee_name || null,
        due: form.due || null,
        notes_path: form.notes_path || null,
        last_activity: form.last_activity || null,
      });
      addToast('Task updated', 'success');
      onClose();
    } catch {
      addToast('Failed to update task', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await removeTask(task.id);
      addToast('Task deleted', 'success');
      onClose();
    } catch {
      addToast('Failed to delete task', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentBody.trim() || posting) return;
    setPosting(true);
    try {
      const newComment = await createComment(task.id, commentAuthor, commentBody);
      setComments(prev => [...prev, newComment]);
      setCommentBody('');
    } catch {
      addToast('Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePostComment();
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-gray-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Dialog open={open} onClose={onClose} title="Edit Task" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
            placeholder="Task title"
          />
        </div>

        {/* Status + Priority row */}
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
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className={cn(inputCls, 'resize-none')}
            placeholder="Describe the task…"
          />
        </div>

        {/* Assignee + Due row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Assignee</label>
            <select
              value={form.assignee_name}
              onChange={e => setForm(f => ({ ...f, assignee_name: e.target.value }))}
              className={inputCls}
            >
              <option value="">Unassigned</option>
              <option value="Arlo">Arlo</option>
              <option value="Scott">Scott</option>
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

        {/* Last activity */}
        <div>
          <label className={labelCls}>Last Activity</label>
          <input
            type="text"
            value={form.last_activity}
            onChange={e => setForm(f => ({ ...f, last_activity: e.target.value }))}
            className={inputCls}
            placeholder="Quick status note…"
          />
        </div>

        {/* Notes path */}
        <div>
          <label className={labelCls}>Linked Notes Path</label>
          <input
            type="text"
            value={form.notes_path}
            onChange={e => setForm(f => ({ ...f, notes_path: e.target.value }))}
            className={inputCls}
            placeholder="/path/to/note.md"
          />
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 flex gap-4">
          <span>Created: {new Date(task.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(task.updated_at).toLocaleString()}</span>
        </div>

        {/* ─── Comments Section ─── */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <MessageCircle size={16} />
            Comments
            {comments.length > 0 && (
              <span className="text-xs font-normal text-gray-500">({comments.length})</span>
            )}
          </h4>

          {/* Comment thread */}
          <div className="max-h-[240px] overflow-y-auto space-y-2 mb-3 pr-1">
            {loadingComments ? (
              <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                <Loader2 size={14} className="animate-spin mr-2" /> Loading…
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No comments yet. Start the conversation.</p>
            ) : (
              comments.map(c => {
                const when = new Date(c.created_at);
                const ts =
                  when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                  ' ' +
                  when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const isArlo = c.author.toLowerCase() === 'arlo';
                return (
                  <div key={c.id} className="bg-[var(--color-surface)] rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded',
                          isArlo ? 'bg-violet-500/20 text-[var(--color-primary)]' : 'bg-blue-500/20 text-[var(--color-primary)]'
                        )}
                      >
                        {c.author}
                      </span>
                      <span className="text-[10px] text-gray-600">{ts}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">{c.body}</p>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* New comment input */}
          <div className="flex gap-2 items-start">
            <select
              value={commentAuthor}
              onChange={e => setCommentAuthor(e.target.value)}
              className="w-[80px] shrink-0 px-2 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="Scott">Scott</option>
              <option value="Arlo">Arlo</option>
            </select>
            <textarea
              value={commentBody}
              onChange={e => setCommentBody(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              rows={2}
              placeholder="Add a comment… (⌘+Enter to post)"
              className={cn(inputCls, 'flex-1 resize-none text-sm')}
            />
            <button
              onClick={handlePostComment}
              disabled={posting || !commentBody.trim()}
              className="shrink-0 p-2 rounded-lg bg-[var(--color-accent)] hover:opacity-90 text-white disabled:opacity-40 transition-colors"
              title="Post comment"
            >
              {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              confirmDelete
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'text-gray-600 hover:text-red-400 hover:bg-red-500/10'
            )}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-[var(--color-surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:opacity-90 text-white disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
