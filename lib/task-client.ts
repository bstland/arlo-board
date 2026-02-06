import type { Task, TaskStatus, TaskPriority } from './types';

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

export async function listTasks(status?: TaskStatus): Promise<Task[]> {
  const body: Record<string, unknown> = {};
  if (status) body.status = status;
  const data = await apiPost<{ tasks: Task[] }>('/api/tasks/list', body);
  return data.tasks;
}

export async function createTask(task: {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_name?: string;
  due?: string;
  notes_path?: string;
}): Promise<Task> {
  const data = await apiPost<{ task: Task }>('/api/tasks/create', task);
  return data.task;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
  const data = await apiPost<{ task: Task }>('/api/tasks/update', { id, ...updates });
  return data.task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiPost('/api/tasks/delete', { id });
}
