'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { PodcastGuest, PipelineState, PipelineAction, PipelineStatus, PipelineSource } from '@/lib/types';
import * as api from '@/lib/pipeline-client';

const initialState: PipelineState = {
  guests: [],
  loading: false,
  error: null,
};

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'SET_GUESTS':
      return { ...state, guests: action.guests, loading: false };
    case 'ADD_GUEST':
      return { ...state, guests: [action.guest, ...state.guests] };
    case 'UPDATE_GUEST':
      return {
        ...state,
        guests: state.guests.map(g => (g.id === action.guest.id ? action.guest : g)),
      };
    case 'DELETE_GUEST':
      return { ...state, guests: state.guests.filter(g => g.id !== action.id) };
    case 'MOVE_GUEST':
      return {
        ...state,
        guests: state.guests.map(g =>
          g.id === action.id ? { ...g, status: action.status } : g
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

interface PipelineContextType {
  state: PipelineState;
  loadGuests: () => Promise<void>;
  addGuest: (guest: {
    host_name: string;
    podcast_name: string;
    podcast_url?: string;
    audience_estimate?: string;
    why_fit?: string;
    status?: PipelineStatus;
    source?: PipelineSource;
    channel?: string;
    outreach_date?: string;
    follow_up_count?: number;
    last_contact_date?: string;
    next_action_date?: string;
    recording_date?: string;
    recording_time?: string;
    recording_platform?: string;
    episode_url?: string;
    air_date?: string;
    notes?: string;
  }) => Promise<PodcastGuest>;
  editGuest: (id: string, updates: Partial<Omit<PodcastGuest, 'id' | 'created_at'>>) => Promise<PodcastGuest>;
  removeGuest: (id: string) => Promise<void>;
  moveGuest: (id: string, status: PipelineStatus) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | null>(null);

export function PipelineProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pipelineReducer, initialState);

  const loadGuests = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const guests = await api.listGuests();
      dispatch({ type: 'SET_GUESTS', guests });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load guests' });
    }
  }, []);

  const addGuest = useCallback(async (guest: {
    host_name: string;
    podcast_name: string;
    podcast_url?: string;
    audience_estimate?: string;
    why_fit?: string;
    status?: PipelineStatus;
    source?: PipelineSource;
    channel?: string;
    outreach_date?: string;
    follow_up_count?: number;
    last_contact_date?: string;
    next_action_date?: string;
    recording_date?: string;
    recording_time?: string;
    recording_platform?: string;
    episode_url?: string;
    air_date?: string;
    notes?: string;
  }) => {
    const created = await api.createGuest(guest);
    dispatch({ type: 'ADD_GUEST', guest: created });
    return created;
  }, []);

  const editGuest = useCallback(async (id: string, updates: Partial<Omit<PodcastGuest, 'id' | 'created_at'>>) => {
    const updated = await api.updateGuest(id, updates);
    dispatch({ type: 'UPDATE_GUEST', guest: updated });
    return updated;
  }, []);

  const removeGuest = useCallback(async (id: string) => {
    await api.deleteGuest(id);
    dispatch({ type: 'DELETE_GUEST', id });
  }, []);

  const moveGuest = useCallback(async (id: string, status: PipelineStatus) => {
    dispatch({ type: 'MOVE_GUEST', id, status });
    try {
      const updated = await api.updateGuest(id, { status });
      dispatch({ type: 'UPDATE_GUEST', guest: updated });
    } catch {
      loadGuests();
    }
  }, [loadGuests]);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  return (
    <PipelineContext.Provider value={{ state, loadGuests, addGuest, editGuest, removeGuest, moveGuest }}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) throw new Error('usePipeline must be used within PipelineProvider');
  return context;
}
