'use client';

import type { WorkflowNodeType } from '@/lib/types';
import type { Node, NodeProps } from '@xyflow/react';
import {
  Bot,
  Clock,
  Compass,
  Flag,
  Gauge,
  Globe,
  Hand,
  Sparkles,
  GitBranch,
  Zap,
  FileOutput,
  Send,
  SquareDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NODE_ICON: Record<WorkflowNodeType, typeof Clock> = {
  cron: Clock,
  skill: Sparkles,
  manual: Hand,
  external: Globe,
  trigger_time: Clock,
  trigger_event: Zap,
  trigger_condition: Gauge,
  trigger_manual: Hand,
  tool: SquareDot,
  actor: Bot,
  decision: GitBranch,
  output: FileOutput,
  delivery: Send,
  end: Flag,
};

export interface SubwayNodeData extends Record<string, unknown> {
  label: string;
  description?: string | null;
  schedule?: string | null;
  nodeType: WorkflowNodeType;
  badge?: string | null;
  primaryColor: string;
  processColors: string[];
  isShared: boolean;
  isDimmed?: boolean;
}

type SubwayNodeType_ = Node<SubwayNodeData, 'subwayNode'>;

export function SubwayNode({ data, selected }: NodeProps<SubwayNodeType_>) {
  const Icon = NODE_ICON[data.nodeType] ?? Compass;
  const dots = data.isShared ? data.processColors.slice(0, 4) : [];

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md',
        'min-w-[180px] max-w-[220px] transition-all duration-200',
        selected && 'border-[#89b4fa]/70 shadow-[#89b4fa]/20',
        data.isDimmed && 'opacity-45'
      )}
      title={data.description ?? undefined}
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl"
        style={{ backgroundColor: data.primaryColor }}
      />
      <div className="flex items-start gap-2 pl-2">
        <div className="h-8 w-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
          <Icon size={14} className="text-[#e2e2f0]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-[#e8e8f5] leading-snug line-clamp-2">
            {data.label}
          </div>
          {data.schedule && (
            <div className="mt-1 text-[11px] text-[#9aa0b4]">{data.schedule}</div>
          )}
        </div>
        {data.badge && (
          <span className="text-[10px] uppercase tracking-wide font-semibold text-[#b9bfd3] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2 py-0.5">
            {data.badge}
          </span>
        )}
      </div>

      {data.isShared && (
        <div className="mt-2 flex items-center gap-1.5 pl-2">
          <span className="text-[10px] uppercase tracking-wide text-[#7d8299]">Transfer</span>
          <div className="flex items-center gap-1">
            {dots.map((color, index) => (
              <span
                key={`${color}-${index}`}
                className="h-2.5 w-2.5 rounded-full border border-[#0f0f1b]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {data.processColors.length > 4 && (
            <span className="text-[10px] text-[#7d8299]">+{data.processColors.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
}
