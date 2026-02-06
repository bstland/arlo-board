import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { PodcastGuest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Guest id is required' }, { status: 400 });
    }

    const allowed = [
      'host_name',
      'podcast_name',
      'podcast_url',
      'audience_estimate',
      'why_fit',
      'status',
      'source',
      'channel',
      'outreach_date',
      'follow_up_count',
      'last_contact_date',
      'next_action_date',
      'recording_date',
      'recording_time',
      'recording_platform',
      'episode_url',
      'air_date',
      'notes',
    ];
    const payload: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) {
        payload[key] = updates[key];
      }
    }
    payload.updated_at = new Date().toISOString();

    const result = await supabaseRequest<PodcastGuest[]>({
      table: 'podcast_guesting',
      method: 'PATCH',
      query: `id=eq.${encodeURIComponent(id)}`,
      body: payload,
    });

    return NextResponse.json({ guest: result[0] || null });
  } catch (error) {
    console.error('Pipeline update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update guest' },
      { status: 500 }
    );
  }
}
