import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/dropbox-auth';
import { DROPBOX_ROOT_PATH } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const fullPath = `${DROPBOX_ROOT_PATH}${path.startsWith('/') ? path : '/' + path}`;
    const normalized = fullPath.replace(/\/+/g, '/');
    if (!normalized.startsWith(DROPBOX_ROOT_PATH)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const accessToken = await getAccessToken();

    const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: normalized }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_summary: 'Unknown error' }));
      console.error('Dropbox get_temporary_link error:', error);
      return NextResponse.json({ error: error.error_summary || 'Failed to get link' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ link: data.link });
  } catch (error) {
    console.error('Get link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
