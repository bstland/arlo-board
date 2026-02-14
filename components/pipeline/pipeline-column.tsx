'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { PodcastGuest, PipelineStatus } from '@/lib/types';
import { GuestCard } from './guest-card';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMN_META: Record<PipelineStatus, { label: string; accent: string; icon: string }> = {
  prospect:  { label: 'Prospect',  accent: 'border-blue-500/50', icon: '🔍' },
  outreach:  { label: 'Outreach',  accent: 'border-yellow-500/50', icon: '📨' },
  follow_up: { label: 'Follow Up', accent: 'border-orange-500/50', icon: '🔄' },
  booked:    { label: 'Booked',    accent: 'border-green-500/50', icon: '🎙️' },
  completed: { label: 'Completed', accent: 'border-emerald-500/50', icon: '✅' },
  declined:  { label: 'Declined',  accent: 'border-red-500/50', icon: '⛔' },
};

interface PipelineColumnProps {
  status: PipelineStatus;
  guests: PodcastGuest[];
  onCardClick: (guest: PodcastGuest) => void;
  onAddClick: () => void;
}

export function PipelineColumn({ status, guests, onCardClick, onAddClick }: PipelineColumnProps) {
  const meta = COLUMN_META[status];

  return (
    <div className={cn(
      'flex flex-col min-w-[280px] w-[280px] lg:flex-1 lg:min-w-0 lg:w-auto',
      'bg-[#181825] rounded-xl border-t-2',
      meta.accent,
    )}>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#313244]/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">{meta.icon}</span>
          <h3 className="text-sm font-semibold text-gray-200">{meta.label}</h3>
          <span className="text-xs text-gray-500 bg-[#313244] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {guests.length}
          </span>
        </div>
        <button
          onClick={onAddClick}
          className="p-1 rounded-md text-gray-500 hover:text-blue-400 hover:bg-[#313244] transition-colors"
          title={`Add guest to ${meta.label}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px] transition-colors duration-200',
              snapshot.isDraggingOver && 'bg-blue-500/5',
            )}
          >
            {guests.map((guest, index) => (
              <Draggable key={guest.id} draggableId={guest.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <GuestCard
                      guest={guest}
                      onClick={() => onCardClick(guest)}
                      isDragging={dragSnapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {guests.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-[80px] text-xs text-gray-600">
                No guests
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
