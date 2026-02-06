// Server-side Supabase REST client — no SDK dependency needed.
// Uses SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
}

interface SupabaseRequestOptions {
  table: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: string; // query params after /rest/v1/table?
  body?: unknown;
  headers?: Record<string, string>;
  single?: boolean; // add Prefer: return=representation + expect single
}

export async function supabaseRequest<T = unknown>({
  table,
  method = 'GET',
  query = '',
  body,
  headers = {},
  single = false,
}: SupabaseRequestOptions): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;

  const preferParts: string[] = [];
  if (method === 'POST') preferParts.push('return=representation');
  if (method === 'PATCH') preferParts.push('return=representation');
  if (method === 'DELETE') preferParts.push('return=representation');
  if (single) preferParts.push('count=exact');

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      ...(preferParts.length ? { 'Prefer': preferParts.join(', ') } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Supabase ${method} ${table} failed (${res.status}): ${errBody}`);
  }

  // DELETE with no content
  if (res.status === 204) return [] as unknown as T;

  return res.json() as Promise<T>;
}
