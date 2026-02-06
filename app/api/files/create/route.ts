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

    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: normalized,
        autorename: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_summary: 'Unknown error' }));
      console.error('Dropbox create_folder error:', error);
      return NextResponse.json({ error: error.error_summary || 'Failed to create folder' }, { status: response.status });
    }

    const data = await response.json();
    const metadata = data.metadata;

    return NextResponse.json({
      success: true,
      metadata: {
        name: metadata.name,
        path: metadata.path_display,
      },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
