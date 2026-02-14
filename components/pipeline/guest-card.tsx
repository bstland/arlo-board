'use client';

import type { PodcastGuest, PipelineSource } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GripVertical, CalendarClock } from 'lucide-react';

const SOURCE_BADGE: Record<PipelineSource, { label: string; cls: string }> = {
  inbound: { label: 'Inbound', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  outbound: { label: 'Outbound', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

function formatFollowUp(nextActionDate: string | null) {
  if (!nextActionDate) return null;
  const target = new Date(nextActionDate);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfDay(target).getTime() - startOfDay(now).getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const dateStr = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diffDays < 0) return { text: `Overdue · ${dateStr}`, overdue: true };
  if (diffDays === 0) return { text: `Follow up today · ${dateStr}`, overdue: false };
  return { text: `Follow up ${dateStr}`, overdue: false };
}

interface GuestCardProps {
  guest: PodcastGuest;
  onClick: () => void;
  isDragging?: boolean;
}

export function GuestCard({ guest, onClick, isDragging }: GuestCardProps) {
  const followUp = formatFollowUp(guest.next_action_date);
  const recordingDate = guest.recording_date ? new Date(guest.recording_date) : null;
  const showRecording = guest.status === 'booked' && recordingDate && !Number.isNaN(recordingDate.getTime());
  const followUpCount = guest.follow_up_count || 0;
  const sourceMeta = guest.source ? SOURCE_BADGE[guest.source] : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 cursor-pointer',
        'hover:border-[#45475a] hover:bg-[#232336] transition-all duration-150',
        isDragging && 'shadow-xl shadow-blue-500/10 border-blue-500/40 rotate-[2deg] scale-105',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className="text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">
            {guest.host_name}
          </h4>
          <p className="text-xs text-gray-400 line-clamp-1">{guest.podcast_name}</p>
        </div>
        {sourceMeta && (
          <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0', sourceMeta.cls)}>
            {sourceMeta.label}
          </span>
        )}
      </div>

      {guest.channel && (
        <p className="text-xs text-gray-500 mb-2 ml-[22px]">{guest.channel}</p>
      )}

      {showRecording && (
        <div className="ml-[22px] mb-2 flex items-center gap-2 text-xs text-emerald-300">
          <CalendarClock size={12} />
          <span className="font-semibold">
            {recordingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {guest.recording_time && <span className="text-gray-400">{guest.recording_time}</span>}
        </div>
      )}

      <div className="flex items-center gap-2 ml-[22px]">
        {followUp && (
          <span className={cn('text-xs', followUp.overdue ? 'text-red-400' : 'text-gray-500')}>
            {followUp.text}
          </span>
        )}
        {followUpCount > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 ml-auto">
            {followUpCount}
          </span>
        )}
      </div>
    </div>
  );
}
