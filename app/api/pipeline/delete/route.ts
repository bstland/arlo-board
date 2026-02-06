import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Guest id is required' }, { status: 400 });
    }

    await supabaseRequest({
      table: 'podcast_guesting',
      method: 'DELETE',
      query: `id=eq.${encodeURIComponent(id)}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pipeline delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete guest' },
      { status: 500 }
    );
  }
}
