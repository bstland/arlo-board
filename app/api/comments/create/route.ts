import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { TaskComment } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { task_id, author, body } = await request.json();

    if (!task_id || !author || !body?.trim()) {
      return NextResponse.json({ error: 'task_id, author, and body are required' }, { status: 400 });
    }

    const rows = await supabaseRequest<TaskComment[]>({
      table: 'task_comments',
      method: 'POST',
      body: { task_id, author, body: body.trim() },
    });

    return NextResponse.json({ comment: rows[0] });
  } catch (error) {
    console.error('Comment create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    );
  }
}
