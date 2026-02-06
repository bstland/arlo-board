'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  type BuiltInNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflow } from '@/contexts/workflow-context';
import type { WorkflowNode as WorkflowNodeRecord, WorkflowEdge as WorkflowEdgeRecord } from '@/lib/types';
import { WorkflowNode } from './workflow-node';
import { WorkflowDetail } from './workflow-detail';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LaneNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  width: number;
  height: number;
}

type LaneNodeType = Node<LaneNodeData, 'lane'>;

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function LaneNode({ data }: NodeProps<LaneNodeType>) {
  return (
    <div
      className="relative rounded-xl border border-transparent pointer-events-none"
      style={{
        width: data.width,
        height: data.height,
        backgroundColor: hexToRgba(data.color, 0.1),
      }}
    >
      <div className="absolute left-4 top-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {data.label}
      </div>
    </div>
  );
}

const nodeTypes = {
  workflowNode: WorkflowNode,
  lane: LaneNode,
};

const LANE_HEIGHT = 220;
const NODE_START_X = 60;
const NODE_GAP_X = 220;
const NODE_OFFSET_Y = 70;

type TriggerFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'manual';

const TRIGGER_FILTERS: { id: TriggerFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'manual', label: 'Manual' },
];

function getTriggerCategory(schedule: string | null): Exclude<TriggerFilter, 'all'> {
  if (!schedule) return 'manual';
  const normalized = schedule.toLowerCase();
  if (normalized.includes('28') || normalized.includes('monthly')) return 'monthly';
  if (/(mon|tue|wed|thu|fri|sat|sun)/.test(normalized)) return 'weekly';
  if (normalized.includes('am') || normalized.includes('pm')) return 'daily';
  return 'daily';
}

function buildNodePosition(
  node: WorkflowNodeRecord,
  laneIndex: number,
  indexInLane: number
) {
  const hasCustom = (node.position_x ?? 0) !== 0 || (node.position_y ?? 0) !== 0;
  if (hasCustom) {
    return { x: node.position_x ?? 0, y: node.position_y ?? 0 };
  }
  return {
    x: NODE_START_X + indexInLane * NODE_GAP_X,
    y: laneIndex * LANE_HEIGHT + NODE_OFFSET_Y,
  };
}

export function WorkflowCanvas() {
  const { state, loadWorkflows } = useWorkflow();
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all');

  const lanes = useMemo(
    () => [...state.lanes].sort((a, b) => a.sort_order - b.sort_order),
    [state.lanes]
  );

  const filteredNodes = useMemo(() => {
    if (triggerFilter === 'all') return state.nodes;
    return state.nodes.filter(node => getTriggerCategory(node.schedule) === triggerFilter);
  }, [state.nodes, triggerFilter]);

  useEffect(() => {
    if (!selectedNode) return;
    const stillVisible = filteredNodes.some(node => node.id === selectedNode.id);
    if (!stillVisible) {
      setDetailOpen(false);
      window.setTimeout(() => setSelectedNode(null), 200);
    }
  }, [filteredNodes, selectedNode]);

  const { flowNodes, flowEdges } = useMemo(() => {
    const laneNodes: Node[] = [];
    const workflowNodes: Node[] = [];

    const nodesByLane = new Map<string, WorkflowNodeRecord[]>();
    for (const node of filteredNodes) {
      const laneId = node.lane_id || 'unassigned';
      if (!nodesByLane.has(laneId)) nodesByLane.set(laneId, []);
      nodesByLane.get(laneId)?.push(node);
    }

    let maxX = 0;

    lanes.forEach((lane, laneIndex) => {
      const laneNodesList = nodesByLane.get(lane.id) || [];
      const sortedNodes = [...laneNodesList].sort((a, b) => {
        const ax = a.position_x ?? 0;
        const bx = b.position_x ?? 0;
        if (ax !== bx) return ax - bx;
        return a.label.localeCompare(b.label);
      });

      sortedNodes.forEach((node, indexInLane) => {
        const position = buildNodePosition(node, laneIndex, indexInLane);
        maxX = Math.max(maxX, position.x);
        workflowNodes.push({
          id: node.id,
          type: 'workflowNode',
          position,
          data: {
            label: node.label,
            schedule: node.schedule,
            nodeType: node.node_type,
          },
          draggable: false,
          selectable: true,
          style: { zIndex: 10 },
        });
      });

      laneNodes.push({
        id: `lane-${lane.id}`,
        type: 'lane',
        position: { x: 0, y: laneIndex * LANE_HEIGHT },
        data: {
          label: lane.name,
          color: lane.color,
          width: 1200,
          height: LANE_HEIGHT - 16,
        },
        draggable: false,
        selectable: false,
        style: { zIndex: 0 },
      });
    });

    const computedWidth = Math.max(1200, maxX + 320);
    const sizedLaneNodes = laneNodes.map(node => ({
      ...node,
      data: {
        ...(node.data as LaneNodeData),
        width: computedWidth,
      },
    }));

    const visibleNodeIds = new Set(workflowNodes.map(node => node.id));
    const flowEdges: Edge[] = state.edges
      .filter(edge => visibleNodeIds.has(edge.source_id) && visibleNodeIds.has(edge.target_id))
      .map((edge: WorkflowEdgeRecord) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        label: edge.label || undefined,
        animated: false,
        type: 'smoothstep',
        style: { stroke: '#6c7086' },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 6,
        labelBgStyle: { fill: '#1e1e2e', color: '#cdd6f4' },
        labelStyle: { fill: '#cdd6f4', fontSize: 11 },
      }));

    return { flowNodes: [...sizedLaneNodes, ...workflowNodes], flowEdges };
  }, [lanes, filteredNodes, state.edges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== 'workflowNode') return;
      const selected = state.nodes.find(n => n.id === node.id) || null;
      setSelectedNode(selected);
      setDetailOpen(!!selected);
    },
    [state.nodes]
  );

  const selectedLane = useMemo(() => {
    if (!selectedNode) return null;
    return lanes.find(l => l.id === selectedNode.lane_id) || null;
  }, [lanes, selectedNode]);

  const selectedSteps = useMemo(() => {
    if (!selectedNode) return [];
    return state.stepsByNode[selectedNode.id] || [];
  }, [selectedNode, state.stepsByNode]);

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    window.setTimeout(() => setSelectedNode(null), 200);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkflows();
    setRefreshing(false);
  }, [loadWorkflows]);

  if (state.loading && state.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-gray-400">Loading workflows…</p>
        </div>
      </div>
    );
  }

  if (state.error && state.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <AlertCircle size={32} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{state.error}</p>
          <button
            onClick={handleRefresh}
            className="text-sm text-violet-400 hover:text-violet-300 underline"
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
          <h2 className="text-lg font-bold text-gray-100">Workflows</h2>
          <span className="text-xs text-gray-500">
            {filteredNodes.length} node{filteredNodes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-[#313244] transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="px-4 py-2 border-b border-[#313244] bg-[#151522]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">Trigger</span>
          {TRIGGER_FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setTriggerFilter(filter.id)}
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                triggerFilter === filter.id
                  ? 'bg-[#313244] text-gray-100 border-[#45475a]'
                  : 'bg-transparent text-gray-400 border-[#313244] hover:text-gray-200 hover:border-[#45475a]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-[#0d0d1a]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          panOnDrag
          nodesDraggable={false}
          style={{ background: '#0d0d1a' }}
        >
          <Background color="#313244" gap={24} size={1} />
          <MiniMap
            pannable
            zoomable
            nodeColor={node => {
              if (node.type === 'lane') return '#313244';
              return '#45475a';
            }}
          />
          <Controls />
        </ReactFlow>

        <WorkflowDetail
          node={selectedNode}
          lane={selectedLane}
          steps={selectedSteps}
          open={detailOpen}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
}
