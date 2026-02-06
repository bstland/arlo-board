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

    // Dropbox download: content in body, metadata in header
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path: normalized }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dropbox download error:', errorText);
      return NextResponse.json({ error: 'Failed to read file' }, { status: response.status });
    }

    const metadataHeader = response.headers.get('Dropbox-API-Result');
    const metadata = metadataHeader ? JSON.parse(metadataHeader) : {};
    const content = await response.text();

    return NextResponse.json({
      content,
      metadata: {
        name: metadata.name || path.split('/').pop(),
        size: metadata.size || content.length,
        modified: metadata.client_modified || metadata.server_modified || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Read file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
