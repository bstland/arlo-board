import type { TaskComment } from './types';

async function apiPost<T>(endpoint: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function listComments(taskId: string): Promise<TaskComment[]> {
  const data = await apiPost<{ comments: TaskComment[] }>('/api/comments/list', { task_id: taskId });
  return data.comments;
}

export async function createComment(taskId: string, author: string, body: string): Promise<TaskComment> {
  const data = await apiPost<{ comment: TaskComment }>('/api/comments/create', {
    task_id: taskId,
    author,
    body,
  });
  return data.comment;
}
