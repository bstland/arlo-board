import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { PodcastGuest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      host_name,
      podcast_name,
      podcast_url,
      audience_estimate,
      why_fit,
      status,
      source,
      channel,
      outreach_date,
      follow_up_count,
      last_contact_date,
      next_action_date,
      recording_date,
      recording_time,
      recording_platform,
      episode_url,
      air_date,
      notes,
    } = body;

    if (!host_name || typeof host_name !== 'string' || !host_name.trim()) {
      return NextResponse.json({ error: 'Host name is required' }, { status: 400 });
    }

    if (!podcast_name || typeof podcast_name !== 'string' || !podcast_name.trim()) {
      return NextResponse.json({ error: 'Podcast name is required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      host_name: host_name.trim(),
      podcast_name: podcast_name.trim(),
      status: status || 'prospect',
    };

    if (podcast_url !== undefined) payload.podcast_url = podcast_url;
    if (audience_estimate !== undefined) payload.audience_estimate = audience_estimate;
    if (why_fit !== undefined) payload.why_fit = why_fit;
    if (source !== undefined) payload.source = source;
    if (channel !== undefined) payload.channel = channel;
    if (outreach_date !== undefined) payload.outreach_date = outreach_date;
    if (follow_up_count !== undefined) payload.follow_up_count = follow_up_count;
    if (last_contact_date !== undefined) payload.last_contact_date = last_contact_date;
    if (next_action_date !== undefined) payload.next_action_date = next_action_date;
    if (recording_date !== undefined) payload.recording_date = recording_date;
    if (recording_time !== undefined) payload.recording_time = recording_time;
    if (recording_platform !== undefined) payload.recording_platform = recording_platform;
    if (episode_url !== undefined) payload.episode_url = episode_url;
    if (air_date !== undefined) payload.air_date = air_date;
    if (notes !== undefined) payload.notes = notes;

    const result = await supabaseRequest<PodcastGuest[]>({
      table: 'podcast_guesting',
      method: 'POST',
      body: payload,
    });

    return NextResponse.json({ guest: result[0] });
  } catch (error) {
    console.error('Pipeline create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create guest' },
      { status: 500 }
    );
  }
}
