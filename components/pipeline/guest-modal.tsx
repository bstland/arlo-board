'use client';

import { useState, useEffect } from 'react';
import type { PodcastGuest, PipelineStatus, PipelineSource } from '@/lib/types';
import { Dialog } from '@/components/ui/dialog';
import { usePipeline } from '@/contexts/pipeline-context';
import { useToast } from '@/contexts/toast-context';
import { Trash2, Save, Loader2 } from 'lucide-react';
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

interface GuestModalProps {
  guest: PodcastGuest | null;
  open: boolean;
  onClose: () => void;
}

export function GuestModal({ guest, open, onClose }: GuestModalProps) {
  const { editGuest, removeGuest } = usePipeline();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    host_name: '',
    podcast_name: '',
    podcast_url: '',
    audience_estimate: '',
    why_fit: '',
    status: 'prospect' as PipelineStatus,
    source: '' as PipelineSource | '',
    channel: '',
    outreach_date: '',
    follow_up_count: '',
    last_contact_date: '',
    next_action_date: '',
    recording_date: '',
    recording_time: '',
    recording_platform: '',
    episode_url: '',
    air_date: '',
    notes: '',
  });

  useEffect(() => {
    if (guest) {
      setForm({
        host_name: guest.host_name || '',
        podcast_name: guest.podcast_name || '',
        podcast_url: guest.podcast_url || '',
        audience_estimate: guest.audience_estimate || '',
        why_fit: guest.why_fit || '',
        status: guest.status || 'prospect',
        source: guest.source || '',
        channel: guest.channel || '',
        outreach_date: guest.outreach_date ? guest.outreach_date.slice(0, 10) : '',
        follow_up_count: guest.follow_up_count?.toString() ?? '',
        last_contact_date: guest.last_contact_date ? guest.last_contact_date.slice(0, 10) : '',
        next_action_date: guest.next_action_date ? guest.next_action_date.slice(0, 10) : '',
        recording_date: guest.recording_date ? guest.recording_date.slice(0, 10) : '',
        recording_time: guest.recording_time || '',
        recording_platform: guest.recording_platform || '',
        episode_url: guest.episode_url || '',
        air_date: guest.air_date ? guest.air_date.slice(0, 10) : '',
        notes: guest.notes || '',
      });
    }
    setConfirmDelete(false);
  }, [guest]);

  if (!guest) return null;

  const handleSave = async () => {
    if (!form.host_name.trim() || !form.podcast_name.trim()) return;
    setSaving(true);
    try {
      await editGuest(guest.id, {
        host_name: form.host_name.trim(),
        podcast_name: form.podcast_name.trim(),
        podcast_url: form.podcast_url || null,
        audience_estimate: form.audience_estimate || null,
        why_fit: form.why_fit || null,
        status: form.status,
        source: form.source || null,
        channel: form.channel || null,
        outreach_date: form.outreach_date || null,
        follow_up_count: form.follow_up_count ? Number(form.follow_up_count) : 0,
        last_contact_date: form.last_contact_date || null,
        next_action_date: form.next_action_date || null,
        recording_date: form.recording_date || null,
        recording_time: form.recording_time || null,
        recording_platform: form.recording_platform || null,
        episode_url: form.episode_url || null,
        air_date: form.air_date || null,
        notes: form.notes || null,
      });
      addToast('Guest updated', 'success');
      onClose();
    } catch {
      addToast('Failed to update guest', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await removeGuest(guest.id);
      addToast('Guest deleted', 'success');
      onClose();
    } catch {
      addToast('Failed to delete guest', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-gray-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <Dialog open={open} onClose={onClose} title="Edit Guest" className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Host Name</label>
            <input
              type="text"
              value={form.host_name}
              onChange={e => setForm(f => ({ ...f, host_name: e.target.value }))}
              className={inputCls}
              placeholder="Host name"
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
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={labelCls}>Audience Estimate</label>
            <input
              type="text"
              value={form.audience_estimate}
              onChange={e => setForm(f => ({ ...f, audience_estimate: e.target.value }))}
              className={inputCls}
              placeholder="e.g. 25k downloads"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Why Fit</label>
          <textarea
            value={form.why_fit}
            onChange={e => setForm(f => ({ ...f, why_fit: e.target.value }))}
            rows={2}
            className={cn(inputCls, 'resize-none')}
            placeholder="Why is this a good fit?"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
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
            <label className={labelCls}>Source</label>
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value as PipelineSource | '' }))}
              className={inputCls}
            >
              <option value="">Select source</option>
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

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Outreach Date</label>
            <input
              type="date"
              value={form.outreach_date}
              onChange={e => setForm(f => ({ ...f, outreach_date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Follow Up Count</label>
            <input
              type="number"
              min={0}
              value={form.follow_up_count}
              onChange={e => setForm(f => ({ ...f, follow_up_count: e.target.value }))}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelCls}>Last Contact Date</label>
            <input
              type="date"
              value={form.last_contact_date}
              onChange={e => setForm(f => ({ ...f, last_contact_date: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Next Action Date</label>
          <input
            type="date"
            value={form.next_action_date}
            onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Recording Date</label>
            <input
              type="date"
              value={form.recording_date}
              onChange={e => setForm(f => ({ ...f, recording_date: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Recording Time</label>
            <input
              type="text"
              value={form.recording_time}
              onChange={e => setForm(f => ({ ...f, recording_time: e.target.value }))}
              className={inputCls}
              placeholder="2:00 PM ET"
            />
          </div>
          <div>
            <label className={labelCls}>Recording Platform</label>
            <input
              type="text"
              value={form.recording_platform}
              onChange={e => setForm(f => ({ ...f, recording_platform: e.target.value }))}
              className={inputCls}
              placeholder="Riverside, Zoom, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Episode URL</label>
            <input
              type="url"
              value={form.episode_url}
              onChange={e => setForm(f => ({ ...f, episode_url: e.target.value }))}
              className={inputCls}
              placeholder="https://"
            />
          </div>
          <div>
            <label className={labelCls}>Air Date</label>
            <input
              type="date"
              value={form.air_date}
              onChange={e => setForm(f => ({ ...f, air_date: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            className={cn(inputCls, 'resize-none')}
            placeholder="Additional notes…"
          />
        </div>

        <div className="text-xs text-gray-500 flex gap-4">
          <span>Created: {new Date(guest.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(guest.updated_at).toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              confirmDelete
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'text-gray-600 hover:text-red-400 hover:bg-red-500/10'
            )}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {confirmDelete ? 'Confirm Delete' : 'Delete'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-[var(--color-surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.host_name.trim() || !form.podcast_name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] hover:opacity-90 text-white disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
