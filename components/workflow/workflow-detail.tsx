'use client';

import type { Lane, WorkflowNode, WorkflowStep, StepType } from '@/lib/types';
import { X, Clock, Sparkles, Hand, Globe, Zap, Cog, GitBranch, FileOutput, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const NODE_ICON = {
  cron: Clock,
  skill: Sparkles,
  manual: Hand,
  external: Globe,
};

const NODE_LABEL: Record<WorkflowNode['node_type'], string> = {
  cron: 'Cron',
  skill: 'Skill',
  manual: 'Manual',
  external: 'External',
};

const STEP_ICON: Record<StepType, typeof Zap> = {
  trigger: Zap,
  process: Cog,
  decision: GitBranch,
  output: FileOutput,
  delivery: Send,
};

const STEP_STYLE: Record<StepType, { border: string; bg: string; iconBg: string; iconColor: string }> = {
  trigger: {
    border: 'border-l-blue-400/70',
    bg: 'bg-blue-500/10 border-blue-500/20',
    iconBg: 'bg-blue-500/20 border-blue-500/30',
    iconColor: 'text-blue-300',
  },
  process: {
    border: 'border-l-emerald-400/70',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
    iconColor: 'text-emerald-300',
  },
  decision: {
    border: 'border-l-amber-400/70',
    bg: 'bg-amber-500/10 border-amber-500/20',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    iconColor: 'text-amber-300',
  },
  output: {
    border: 'border-l-sky-400/70',
    bg: 'bg-sky-500/10 border-sky-500/20',
    iconBg: 'bg-sky-500/20 border-sky-500/30',
    iconColor: 'text-sky-300',
  },
  delivery: {
    border: 'border-l-violet-400/70',
    bg: 'bg-violet-500/10 border-violet-500/20',
    iconBg: 'bg-violet-500/20 border-violet-500/30',
    iconColor: 'text-violet-300',
  },
};

interface WorkflowDetailProps {
  node: WorkflowNode | null;
  lane: Lane | null;
  steps: WorkflowStep[];
  open: boolean;
  onClose: () => void;
}

export function WorkflowDetail({ node, lane, steps, open, onClose }: WorkflowDetailProps) {
  if (!node) return null;
  const Icon = NODE_ICON[node.node_type];
  const orderedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div
      className={cn(
        'absolute right-0 top-0 h-full w-[320px] bg-[#1e1e2e] border-l border-[#313244] shadow-xl',
        'transition-transform duration-200 z-20',
        open ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#313244]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#313244] flex items-center justify-center">
            <Icon size={16} className="text-gray-200" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-100">{node.label}</div>
            <div className="text-xs text-gray-500">{NODE_LABEL[node.node_type]}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#313244]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {lane && (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">Lane</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded border"
              style={{
                borderColor: lane.color,
                color: lane.color,
                backgroundColor: `${lane.color}20`,
              }}
            >
              {lane.name}
            </span>
          </div>
        )}

        {node.schedule && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock size={14} className="text-gray-400" />
            <span>{node.schedule}</span>
          </div>
        )}

        {node.description && (
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Details</div>
            <p className="text-sm text-gray-300 leading-relaxed">{node.description}</p>
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Steps</div>
          {orderedSteps.length === 0 ? (
            <div className="text-xs text-gray-500 bg-[#11111b] border border-[#313244] rounded-md p-3">
              No internal steps recorded for this node.
            </div>
          ) : (
            <div className="space-y-4">
              {orderedSteps.map((step, index) => {
                const StepIcon = STEP_ICON[step.step_type];
                const stepStyle = STEP_STYLE[step.step_type];
                return (
                  <div key={step.id} className="flex items-stretch gap-3">
                    <div className="flex flex-col items-center self-stretch">
                      <div
                        className={cn(
                          'h-7 w-7 rounded-full border flex items-center justify-center',
                          stepStyle.iconBg
                        )}
                      >
                        <StepIcon size={13} className={stepStyle.iconColor} />
                      </div>
                      {index < orderedSteps.length - 1 && (
                        <div className="w-px flex-1 bg-[#313244] mt-1" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2',
                        stepStyle.bg,
                        stepStyle.border
                      )}
                    >
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 uppercase tracking-wide">
                        <span className="font-semibold text-gray-300">#{step.step_order}</span>
                        <span>{step.step_type}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-100 mt-1">{step.label}</div>
                      {step.description && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
