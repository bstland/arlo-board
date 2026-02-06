import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Task id is required' }, { status: 400 });
    }

    await supabaseRequest({
      table: 'tasks',
      method: 'DELETE',
      query: `id=eq.${encodeURIComponent(id)}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete task' },
      { status: 500 }
    );
  }
}
