import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    // Only allow known fields
    const allowed = ['title', 'description', 'status', 'priority', 'assignee_name', 'assignee_id', 'due', 'notes_path', 'last_activity', 'created_by'];
    const payload: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) {
        payload[key] = updates[key];
      }
    }
    payload.updated_at = new Date().toISOString();

    const result = await supabaseRequest<Task[]>({
      table: 'tasks',
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(id)}`,
      body: payload,
    });

    return NextResponse.json({ task: result[0] || null });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}
