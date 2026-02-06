import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { TaskComment } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { task_id } = await request.json();
    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const comments = await supabaseRequest<TaskComment[]>({
      table: 'task_comments',
      method: 'GET',
      query: `task_id=eq.${encodeURIComponent(task_id)}&order=created_at.asc`,
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Comments list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
