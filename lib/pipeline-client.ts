import type { PodcastGuest, PipelineStatus, PipelineSource } from './types';

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

export async function listGuests(status?: PipelineStatus): Promise<PodcastGuest[]> {
  const body: Record<string, unknown> = {};
  if (status) body.status = status;
  const data = await apiPost<{ guests: PodcastGuest[] }>('/api/pipeline/list', body);
  return data.guests;
}

export async function createGuest(guest: {
  host_name: string;
  podcast_name: string;
  podcast_url?: string;
  audience_estimate?: string;
  why_fit?: string;
  status?: PipelineStatus;
  source?: PipelineSource;
  channel?: string;
  outreach_date?: string;
  follow_up_count?: number;
  last_contact_date?: string;
  next_action_date?: string;
  recording_date?: string;
  recording_time?: string;
  recording_platform?: string;
  episode_url?: string;
  air_date?: string;
  notes?: string;
}): Promise<PodcastGuest> {
  const data = await apiPost<{ guest: PodcastGuest }>('/api/pipeline/create', guest);
  return data.guest;
}

export async function updateGuest(id: string, updates: Partial<Omit<PodcastGuest, 'id' | 'created_at'>>): Promise<PodcastGuest> {
  const data = await apiPost<{ guest: PodcastGuest }>('/api/pipeline/update', { id, ...updates });
  return data.guest;
}

export async function deleteGuest(id: string): Promise<void> {
  await apiPost('/api/pipeline/delete', { id });
}
