export interface SearchResult {
  id: string;
  type: 'task' | 'comment' | 'file' | 'pipeline';
  title: string;
  snippet: string;
  url?: string;
  parentId?: string;
  parentTitle?: string;
  matchField: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query.trim() }),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Search failed' }));
    throw new Error(err.error || 'Search failed');
  }
  
  const data = await res.json();
  return data.results;
}
