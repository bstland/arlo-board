import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, assignee_name, due, notes_path } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      title: title.trim(),
      status: status || 'backlog',
      priority: priority || 'medium',
    };
    if (description !== undefined) payload.description = description;
    if (assignee_name !== undefined) payload.assignee_name = assignee_name;
    if (due !== undefined) payload.due = due;
    if (notes_path !== undefined) payload.notes_path = notes_path;

    const result = await supabaseRequest<Task[]>({
      table: 'tasks',
      method: 'POST',
      body: payload,
    });

    return NextResponse.json({ task: result[0] });
  } catch (error) {
    console.error('Task create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
