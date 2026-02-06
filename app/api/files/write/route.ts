import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/dropbox-auth';
import { DROPBOX_ROOT_PATH } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { path, content } = await request.json();
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    const fullPath = `${DROPBOX_ROOT_PATH}${path.startsWith('/') ? path : '/' + path}`;
    const normalized = fullPath.replace(/\/+/g, '/');
    if (!normalized.startsWith(DROPBOX_ROOT_PATH)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const accessToken = await getAccessToken();

    // Dropbox upload: content as raw body, path in header
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: normalized,
          mode: 'overwrite',
          autorename: false,
          mute: true,
        }),
        'Content-Type': 'application/octet-stream',
      },
      body: content || '',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dropbox upload error:', errorText);
      return NextResponse.json({ error: 'Failed to write file' }, { status: response.status });
    }

    const metadata = await response.json();

    return NextResponse.json({
      success: true,
      metadata: {
        name: metadata.name,
        size: metadata.size,
        modified: metadata.client_modified || metadata.server_modified,
      },
    });
  } catch (error) {
    console.error('Write file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
