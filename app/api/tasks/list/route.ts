import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { Task } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };

    let query = 'select=*,task_comments(id)&order=updated_at.desc';
    if (status) {
      query += `&status=eq.${encodeURIComponent(status)}`;
    }

    const rows = await supabaseRequest<(Task & { task_comments?: { id: string }[] })[]>({
      table: 'tasks',
      method: 'GET',
      query,
    });

    // Attach comment_count to each task
    const tasks = rows.map(({ task_comments, ...t }) => ({
      ...t,
      comment_count: task_comments?.length ?? 0,
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
