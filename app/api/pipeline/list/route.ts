import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { PodcastGuest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };

    let query = 'select=*&order=updated_at.desc';
    if (status) {
      query += `&status=eq.${encodeURIComponent(status)}`;
    }

    const guests = await supabaseRequest<PodcastGuest[]>({
      table: 'podcast_guesting',
      method: 'GET',
      query,
    });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error('Pipeline list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}
