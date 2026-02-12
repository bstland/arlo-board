import type { Lane, WorkflowNode, WorkflowEdge, WorkflowStep, WorkflowProcess } from './types';

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function listWorkflows(): Promise<{
  lanes: Lane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  processes: WorkflowProcess[];
  steps: WorkflowStep[];
}> {
  return apiGet<{
    lanes: Lane[];
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    processes: WorkflowProcess[];
    steps: WorkflowStep[];
  }>('/api/workflow/list');
}
