'use client';

import { useState, useMemo, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { PodcastGuest, PipelineStatus } from '@/lib/types';
import { usePipeline } from '@/contexts/pipeline-context';
import { PipelineColumn } from './pipeline-column';
import { GuestModal } from './guest-modal';
import { CreateGuestModal } from './create-guest-modal';
import { Plus, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMNS: PipelineStatus[] = ['prospect', 'outreach', 'follow_up', 'booked', 'completed'];

export function PipelineBoard() {
  const { state, moveGuest, loadGuests } = usePipeline();
  const [selectedGuest, setSelectedGuest] = useState<PodcastGuest | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<PipelineStatus>('prospect');
  const [refreshing, setRefreshing] = useState(false);

  const columns = useMemo(() => {
    const grouped: Record<PipelineStatus, PodcastGuest[]> = {
      prospect: [],
      outreach: [],
      follow_up: [],
      booked: [],
      completed: [],
      declined: [],
    };
    for (const guest of state.guests) {
      const status = guest.status as PipelineStatus;
      if (grouped[status] && status !== 'declined') {
        grouped[status].push(guest);
      }
    }
    return grouped;
  }, [state.guests]);

  const visibleCount = useMemo(
    () => state.guests.filter(g => g.status !== 'declined').length,
    [state.guests]
  );

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as PipelineStatus;
    const guest = state.guests.find(g => g.id === draggableId);
    if (guest && guest.status !== newStatus) {
      moveGuest(draggableId, newStatus);
    }
  }, [state.guests, moveGuest]);

  const handleCardClick = useCallback((guest: PodcastGuest) => {
    setSelectedGuest(guest);
    setEditOpen(true);
  }, []);

  const handleAddClick = useCallback((status: PipelineStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGuests();
    setRefreshing(false);
  }, [loadGuests]);

  if (state.loading && state.guests.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
          <p className="text-sm text-gray-400">Loading pipeline…</p>
        </div>
      </div>
    );
  }

  if (state.error && state.guests.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{state.error}</p>
          <button
            onClick={handleRefresh}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#313244] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-100">Pipeline</h2>
          <span className="text-xs text-gray-500">
            {visibleCount} guest{visibleCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#313244] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
          </button>
          <button
            onClick={() => handleAddClick('prospect')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Guest</span>
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-3 h-full min-w-max lg:min-w-0">
            {COLUMNS.map(status => (
              <PipelineColumn
                key={status}
                status={status}
                guests={columns[status]}
                onCardClick={handleCardClick}
                onAddClick={() => handleAddClick(status)}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      <GuestModal
        guest={selectedGuest}
        open={editOpen}
        onClose={() => { setEditOpen(false); setSelectedGuest(null); }}
      />
      <CreateGuestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultStatus={createStatus}
      />
    </div>
  );
}
