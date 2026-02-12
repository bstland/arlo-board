'use client';

import type { Edge, EdgeProps } from '@xyflow/react';
import { BaseEdge, getBezierPath } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface SubwayEdgeData extends Record<string, unknown> {
  color: string;
  label?: string;
  active?: boolean;
  dimmed?: boolean;
  showLabel?: boolean;
}

type SubwayEdgeType = Edge<SubwayEdgeData, 'subwayEdge'>;

export function SubwayEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<SubwayEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const color = data?.color ?? '#94a3b8';
  const isActive = data?.active ?? false;
  const isDimmed = data?.dimmed ?? false;
  const showLabel = data?.showLabel ?? false;

  return (
    <g className={cn('group', isDimmed && 'opacity-35')}>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: isActive ? 3.2 : 2.2,
          opacity: isActive ? 0.95 : 0.7,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 10"
        className="subway-flow-dots"
      />

      {data?.label && (
        <text
          x={labelX}
          y={labelY}
          className={cn(
            'fill-[#e5e7f5] text-[10px] font-semibold tracking-wide',
            'opacity-0 transition-opacity duration-200',
            (showLabel || isActive) && 'opacity-100',
            'group-hover:opacity-100'
          )}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {data.label}
        </text>
      )}
    </g>
  );
}
