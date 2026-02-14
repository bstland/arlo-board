'use client';

import { useState } from 'react';
import type { PipelineStatus, PipelineSource } from '@/lib/types';
import { Dialog } from '@/components/ui/dialog';
import { usePipeline } from '@/contexts/pipeline-context';
import { useToast } from '@/contexts/toast-context';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: PipelineStatus; label: string }[] = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
];

const SOURCE_OPTIONS: { value: PipelineSource; label: string }[] = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
];

const CHANNEL_OPTIONS = ['LinkedIn', 'Email', 'DM', 'Referral', 'Other'];

interface CreateGuestModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: PipelineStatus;
}

export function CreateGuestModal({ open, onClose, defaultStatus = 'prospect' }: CreateGuestModalProps) {
  const { addGuest } = usePipeline();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    host_name: '',
    podcast_name: '',
    podcast_url: '',
    source: 'outbound' as PipelineSource,
    channel: '',
    notes: '',
    status: defaultStatus,
  });

  const handleClose = () => {
    setForm({
      host_name: '',
      podcast_name: '',
      podcast_url: '',
      source: 'outbound',
      channel: '',
      notes: '',
      status: defaultStatus,
    });
    onClose();
  };

  const handleCreate = async () => {
    if (!form.host_name.trim() || !form.podcast_name.trim()) return;
    setSaving(true);
    try {
      await addGuest({
        host_name: form.host_name.trim(),
        podcast_name: form.podcast_name.trim(),
        podcast_url: form.podcast_url || undefined,
        source: form.source,
        channel: form.channel || undefined,
        notes: form.notes || undefined,
        status: form.status,
      });
      addToast('Guest created', 'success');
      handleClose();
    } catch {
      addToast('Failed to create guest', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#313244] bg-[#313244] text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <Dialog open={open} onClose={handleClose} title="New Guest">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Host Name</label>
          <input
            type="text"
            value={form.host_name}
            onChange={e => setForm(f => ({ ...f, host_name: e.target.value }))}
            className={inputCls}
            placeholder="Host name"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && form.host_name.trim() && form.podcast_name.trim()) handleCreate();
            }}
          />
        </div>

        <div>
          <label className={labelCls}>Podcast Name</label>
          <input
            type="text"
            value={form.podcast_name}
            onChange={e => setForm(f => ({ ...f, podcast_name: e.target.value }))}
            className={inputCls}
            placeholder="Podcast name"
          />
        </div>

        <div>
          <label className={labelCls}>Podcast URL</label>
          <input
            type="url"
            value={form.podcast_url}
            onChange={e => setForm(f => ({ ...f, podcast_url: e.target.value }))}
            className={inputCls}
            placeholder="https://"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Source</label>
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value as PipelineSource }))}
              className={inputCls}
            >
              {SOURCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Channel</label>
            <select
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
              className={inputCls}
            >
              <option value="">Select channel</option>
              {CHANNEL_OPTIONS.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as PipelineStatus }))}
            className={inputCls}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className={cn(inputCls, 'resize-none')}
            placeholder="Quick notes…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#313244]">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-[#313244] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.host_name.trim() || !form.podcast_name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Guest
          </button>
        </div>
      </div>
    </Dialog>
  );
}
