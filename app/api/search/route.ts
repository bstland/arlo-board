import { NextRequest, NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { Task, TaskComment, PodcastGuest } from '@/lib/types';

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

function highlightMatch(text: string, query: string, maxLength = 100): string {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  
  if (idx === -1) {
    return text.slice(0, maxLength) + (text.length > maxLength ? '…' : '');
  }
  
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 50);
  let snippet = text.slice(start, end);
  
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  
  return snippet;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }
    
    const searchTerm = query.trim().toLowerCase();
    const results: SearchResult[] = [];
    
    // Search tasks (title & description) using ilike
    const tasks = await supabaseRequest<Task[]>({
      table: 'tasks',
      method: 'GET',
      query: `select=*&or=(title.ilike.*${encodeURIComponent(searchTerm)}*,description.ilike.*${encodeURIComponent(searchTerm)}*)&limit=20`,
    });
    
    for (const task of tasks) {
      const titleMatch = task.title.toLowerCase().includes(searchTerm);
      const descMatch = task.description?.toLowerCase().includes(searchTerm);
      
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        snippet: titleMatch 
          ? highlightMatch(task.title, query) 
          : highlightMatch(task.description || '', query),
        matchField: titleMatch ? 'title' : 'description',
      });
    }
    
    // Search comments (body text)
    const comments = await supabaseRequest<(TaskComment & { tasks?: { id: string; title: string } })[]>({
      table: 'task_comments',
      method: 'GET',
      query: `select=*,tasks(id,title)&body=ilike.*${encodeURIComponent(searchTerm)}*&limit=20`,
    });
    
    for (const comment of comments) {
      results.push({
        id: comment.id,
        type: 'comment',
        title: `Comment by ${comment.author}`,
        snippet: highlightMatch(comment.body, query),
        parentId: comment.task_id,
        parentTitle: comment.tasks?.title || 'Unknown task',
        matchField: 'body',
      });
    }
    
    // Search pipeline guests (host_name, podcast_name, notes)
    const guests = await supabaseRequest<PodcastGuest[]>({
      table: 'podcast_guests',
      method: 'GET',
      query: `select=*&or=(host_name.ilike.*${encodeURIComponent(searchTerm)}*,podcast_name.ilike.*${encodeURIComponent(searchTerm)}*,notes.ilike.*${encodeURIComponent(searchTerm)}*)&limit=20`,
    });
    
    for (const guest of guests) {
      const hostMatch = guest.host_name.toLowerCase().includes(searchTerm);
      const podcastMatch = guest.podcast_name.toLowerCase().includes(searchTerm);
      const notesMatch = guest.notes?.toLowerCase().includes(searchTerm);
      
      let matchField = 'host_name';
      let snippet = guest.host_name;
      
      if (podcastMatch) {
        matchField = 'podcast_name';
        snippet = highlightMatch(guest.podcast_name, query);
      } else if (notesMatch) {
        matchField = 'notes';
        snippet = highlightMatch(guest.notes || '', query);
      } else {
        snippet = highlightMatch(guest.host_name, query);
      }
      
      results.push({
        id: guest.id,
        type: 'pipeline',
        title: `${guest.host_name} - ${guest.podcast_name}`,
        snippet,
        matchField,
      });
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
