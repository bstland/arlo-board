import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/dropbox-auth';
import { DROPBOX_ROOT_PATH } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { path = '' } = await request.json();

    // Build full path and enforce root boundary
    const fullPath = path ? `${DROPBOX_ROOT_PATH}${path.startsWith('/') ? path : '/' + path}` : DROPBOX_ROOT_PATH;
    const normalized = fullPath.replace(/\/+/g, '/');
    if (!normalized.startsWith(DROPBOX_ROOT_PATH)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const accessToken = await getAccessToken();

    // Send the full path to Dropbox (only use empty string for true Dropbox root)
    const dropboxPath = normalized;

    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: dropboxPath,
        include_media_info: true,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        limit: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_summary: 'Unknown error' }));
      console.error('Dropbox list_folder error:', error);
      return NextResponse.json({ error: error.error_summary || 'Dropbox API error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('List folder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
