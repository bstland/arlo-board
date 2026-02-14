'use client';

import type { WorkflowNodeType } from '@/lib/types';
import type { Node, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Clock, Sparkles, Hand, Globe, Zap, Gauge, Bot, GitBranch, FileOutput, Send } from 'lucide-react';

const NODE_ICON: Partial<Record<WorkflowNodeType, typeof Clock>> = {
  cron: Clock,
  skill: Sparkles,
  manual: Hand,
  external: Globe,
  trigger_time: Clock,
  trigger_event: Zap,
  trigger_condition: Gauge,
  trigger_manual: Hand,
  tool: Sparkles,
  actor: Bot,
  decision: GitBranch,
  output: FileOutput,
  delivery: Send,
  end: Globe,
};

const NODE_BADGE: Partial<Record<WorkflowNodeType, { label: string; color: string; bg: string }>> = {
  cron: { label: 'Cron', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-500/30' },
  skill: { label: 'Skill', color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  manual: { label: 'Manual', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  external: { label: 'External', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/30' },
  trigger_time: { label: 'Time', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-500/30' },
  trigger_event: { label: 'Event', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/30' },
  trigger_condition: { label: 'Condition', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  trigger_manual: { label: 'Manual', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  tool: { label: 'Tool', color: 'text-purple-300', bg: 'bg-purple-500/20 border-purple-500/30' },
  actor: { label: 'Actor', color: 'text-indigo-300', bg: 'bg-indigo-500/20 border-indigo-500/30' },
  decision: { label: 'Decision', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  output: { label: 'Output', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/30' },
  delivery: { label: 'Delivery', color: 'text-violet-300', bg: 'bg-violet-500/20 border-violet-500/30' },
  end: { label: 'End', color: 'text-rose-300', bg: 'bg-rose-500/20 border-rose-500/30' },
};

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  schedule?: string | null;
  nodeType: WorkflowNodeType;
}

type WorkflowNodeType_ = Node<WorkflowNodeData, 'workflowNode'>;

export function WorkflowNode({ data, selected }: NodeProps<WorkflowNodeType_>) {
  const Icon = NODE_ICON[data.nodeType] ?? Clock;
  const badge = NODE_BADGE[data.nodeType] ?? NODE_BADGE.external!;

  return (
    <div
      className={cn(
        'bg-[#1e1e2e] border border-[#313244] rounded-lg px-3 py-2 min-w-[180px] max-w-[220px]',
        'shadow-sm transition-all duration-150',
        selected && 'border-violet-500/60 shadow-violet-500/20',
        'hover:border-[#45475a] hover:bg-[#232336]'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-md bg-[#313244] flex items-center justify-center shrink-0">
          <Icon size={13} className="text-gray-200" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-100 leading-snug line-clamp-2">
            {data.label}
          </div>
        </div>
        <span
          className={cn(
            'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0',
            badge.bg,
            badge.color
          )}
        >
          {badge.label}
        </span>
      </div>
      {data.schedule && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-[#313244]/70 border border-[#313244] rounded px-1.5 py-0.5">
            <Clock size={10} />
            {data.schedule}
          </span>
        </div>
      )}
    </div>
  );
}
