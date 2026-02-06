import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/dropbox-auth';
import { DROPBOX_ROOT_PATH } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { fromPath, toPath } = await request.json();
    if (!fromPath || !toPath) {
      return NextResponse.json({ error: 'fromPath and toPath are required' }, { status: 400 });
    }

    const fullFrom = `${DROPBOX_ROOT_PATH}${fromPath.startsWith('/') ? fromPath : '/' + fromPath}`;
    const fullTo = `${DROPBOX_ROOT_PATH}${toPath.startsWith('/') ? toPath : '/' + toPath}`;
    const normalizedFrom = fullFrom.replace(/\/+/g, '/');
    const normalizedTo = fullTo.replace(/\/+/g, '/');

    if (!normalizedFrom.startsWith(DROPBOX_ROOT_PATH) || !normalizedTo.startsWith(DROPBOX_ROOT_PATH)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const accessToken = await getAccessToken();

    const response = await fetch('https://api.dropboxapi.com/2/files/move_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_path: normalizedFrom,
        to_path: normalizedTo,
        autorename: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_summary: 'Unknown error' }));
      console.error('Dropbox move error:', error);
      return NextResponse.json({ error: error.error_summary || 'Failed to move' }, { status: response.status });
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
    console.error('Move error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
