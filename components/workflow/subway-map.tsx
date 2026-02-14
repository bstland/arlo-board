'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useWorkflow } from '@/contexts/workflow-context';
import type {
  Lane,
  WorkflowEdge,
  WorkflowNode,
  WorkflowProcess,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@/lib/types';
import { WorkflowDetail } from './workflow-detail';
import { SubwayNode } from './subway-node';
import { SubwayEdge } from './subway-edge';
import { AlertCircle, Check, Filter, Loader2, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes = { subwayNode: SubwayNode };
const edgeTypes = { subwayEdge: SubwayEdge };

const NODE_WIDTH = 190;
const NODE_HEIGHT = 72;

const DEFAULT_PROCESS_META: Record<
  string,
  { color: string; trigger_type: WorkflowTriggerType; schedule: string | null; owner: string | null }
> = {
  'Content Mining': { color: '#f9e2af', trigger_type: 'time', schedule: '4 AM', owner: 'Arlo' },
  'Daily Self-Review': { color: '#a6e3a1', trigger_type: 'time', schedule: '5 AM', owner: 'Arlo' },
  'FMB Question Hunter': { color: '#89b4fa', trigger_type: 'time', schedule: '6 AM', owner: 'Arlo' },
  'LinkedIn Post': { color: '#cba6f7', trigger_type: 'time', schedule: '6 AM M-F', owner: 'Arlo' },
  'Morning Brief': { color: '#f38ba8', trigger_type: 'time', schedule: '7 AM', owner: 'Arlo' },
  'LGPass Portal Capture': { color: '#fab387', trigger_type: 'time', schedule: '2:05 AM', owner: 'Arlo' },
  'Facebook Friend Requests': { color: '#74c7ec', trigger_type: 'time', schedule: '8 PM', owner: 'Arlo' },
  'Landmodo SEO': { color: '#94e2d5', trigger_type: 'time', schedule: 'Mon 3 AM', owner: 'Arlo' },
  'Substack Article': { color: '#f2cdcd', trigger_type: 'time', schedule: 'Tue 6 AM', owner: 'Arlo' },
  'LGPass Sales to Airtable': { color: '#eba0ac', trigger_type: 'time', schedule: 'Sat 4 AM', owner: 'Arlo' },
  'Memory Audit': { color: '#b4befe', trigger_type: 'time', schedule: 'Sun 5 AM', owner: 'Arlo' },
  'Capital Recovery': { color: '#a6adc8', trigger_type: 'time', schedule: 'Monthly', owner: 'Arlo' },
  'Scott Review': { color: '#f38ba8', trigger_type: 'manual', schedule: null, owner: 'Scott' },
  'VA Payroll Check': { color: '#89dceb', trigger_type: 'time', schedule: 'Biweekly', owner: 'Arlo' },
};

const PALETTE = ['#f9e2af', '#a6e3a1', '#89b4fa', '#cba6f7', '#f38ba8', '#94e2d5', '#fab387'];

const TRIGGER_FILTERS: { id: 'all' | WorkflowTriggerType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'time', label: 'Time' },
  { id: 'event', label: 'Event' },
  { id: 'condition', label: 'Condition' },
  { id: 'manual', label: 'Manual' },
];

const STATUS_FILTERS: { id: 'all' | WorkflowStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'disabled', label: 'Disabled' },
  { id: 'error', label: 'Error' },
];

const OWNER_MAP: Record<string, string> = {
  Scott: 'Scott',
  'Arlo Main': 'Arlo',
  'Arlo Isolated': 'Arlo',
  External: 'External',
};

function resolveOwner(lane: Lane | null, fallback?: string | null) {
  if (fallback) return fallback;
  if (!lane) return null;
  return OWNER_MAP[lane.name] ?? lane.name;
}

function isProcessNode(node: WorkflowNode) {
  return node.node_type === 'cron' || node.node_type === 'manual' || node.node_type.startsWith('trigger_');
}

type ProcessLine = WorkflowProcess & { sourceNodeId: string | null };

function buildProcessList(
  nodes: WorkflowNode[],
  lanes: Lane[],
  processes: WorkflowProcess[]
): ProcessLine[] {
  const laneById = new Map(lanes.map(lane => [lane.id, lane]));
  const nodeByLabel = new Map(nodes.map(node => [node.label, node]));
  const fallbackProcesses: WorkflowProcess[] = nodes
    .filter(node => isProcessNode(node))
    .map((node, index) => {
      const lane = laneById.get(node.lane_id ?? '') ?? null;
      const meta = DEFAULT_PROCESS_META[node.label];
      const color = meta?.color ?? PALETTE[index % PALETTE.length];
      return {
        id: node.id,
        name: node.label,
        description: node.description,
        trigger_type: meta?.trigger_type ?? (node.node_type === 'manual' ? 'manual' : 'time'),
        color,
        schedule: meta?.schedule ?? node.schedule,
        owner: resolveOwner(lane, meta?.owner ?? null),
        status: 'active',
        created_at: new Date(0).toISOString(),
      };
    });

  if (processes.length === 0) {
    return fallbackProcesses.map(process => ({
      ...process,
      sourceNodeId: process.id,
    }));
  }

  return processes.map((process, index) => {
    const meta = DEFAULT_PROCESS_META[process.name];
    const nodeMatch = nodeByLabel.get(process.name);
    return {
      ...process,
      color: process.color || meta?.color || PALETTE[index % PALETTE.length],
      schedule: process.schedule ?? meta?.schedule ?? nodeMatch?.schedule ?? null,
      owner: process.owner ?? meta?.owner ?? resolveOwner(nodeMatch ? laneById.get(nodeMatch.lane_id ?? '') ?? null : null, null),
      trigger_type: process.trigger_type ?? meta?.trigger_type ?? 'time',
      sourceNodeId: nodeMatch?.id ?? null,
    };
  });
}

function buildRoutes(
  processes: ProcessLine[],
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const edgesByNode = new Map<string, WorkflowEdge[]>();
  edges.forEach(edge => {
    if (!edgesByNode.has(edge.source_id)) edgesByNode.set(edge.source_id, []);
    if (!edgesByNode.has(edge.target_id)) edgesByNode.set(edge.target_id, []);
    edgesByNode.get(edge.source_id)?.push(edge);
    edgesByNode.get(edge.target_id)?.push(edge);
  });

  const processNodeIds = new Set(
    processes.map(process => process.sourceNodeId).filter(Boolean) as string[]
  );

  const routes = new Map<
    string,
    { nodeIds: Set<string>; edgeIds: Set<string>; distances: Map<string, number> }
  >();

  for (const process of processes) {
    const startId = process.sourceNodeId;
    if (!startId || !nodeById.has(startId)) {
      routes.set(process.id, { nodeIds: new Set(), edgeIds: new Set(), distances: new Map() });
      continue;
    }

    const nodeIds = new Set<string>([startId]);
    const edgeIds = new Set<string>();
    const distances = new Map<string, number>([[startId, 0]]);
    const queue: string[] = [startId];

    while (queue.length) {
      const current = queue.shift() as string;
      const currentDistance = distances.get(current) ?? 0;
      const nextEdges = edgesByNode.get(current) ?? [];

      for (const edge of nextEdges) {
        const nextId = edge.source_id === current ? edge.target_id : edge.source_id;
        if (processNodeIds.has(nextId) && nextId !== startId) {
          continue;
        }
        edgeIds.add(edge.id);
        if (!nodeIds.has(nextId)) {
          nodeIds.add(nextId);
          distances.set(nextId, currentDistance + 1);
          queue.push(nextId);
        }
      }
    }

    routes.set(process.id, { nodeIds, edgeIds, distances });
  }

  return routes;
}

function buildLayout(
  nodes: Node[],
  layoutEdges: Array<{ source: string; target: string }>
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 60,
    ranksep: 110,
    marginx: 30,
    marginy: 30,
  });

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  layoutEdges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map(node => {
    const position = dagreGraph.node(node.id);
    if (!position) return node;
    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

export function SubwayMap() {
  const { state, loadWorkflows } = useWorkflow();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [triggerFilter, setTriggerFilter] = useState<'all' | WorkflowTriggerType>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | WorkflowStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [processVisibility, setProcessVisibility] = useState<Record<string, boolean>>({});

  const processes = useMemo(
    () => buildProcessList(state.nodes, state.lanes, state.processes),
    [state.lanes, state.nodes, state.processes]
  );

  useEffect(() => {
    setProcessVisibility(prev => {
      const next = { ...prev };
      processes.forEach(process => {
        if (next[process.id] === undefined) next[process.id] = true;
      });
      return next;
    });
  }, [processes]);

  const routes = useMemo(
    () => buildRoutes(processes, state.nodes, state.edges),
    [processes, state.nodes, state.edges]
  );

  const owners = useMemo(() => {
    const set = new Set<string>();
    processes.forEach(process => {
      if (process.owner) set.add(process.owner);
    });
    return Array.from(set).sort();
  }, [processes]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProcesses = useMemo(() => {
    return processes.filter(process => {
      if (triggerFilter !== 'all' && process.trigger_type !== triggerFilter) return false;
      if (statusFilter !== 'all' && process.status !== statusFilter) return false;
      if (ownerFilter !== 'all' && process.owner !== ownerFilter) return false;
      if (!normalizedSearch) return true;
      if (process.name.toLowerCase().includes(normalizedSearch)) return true;
      const route = routes.get(process.id);
      if (!route) return false;
      for (const nodeId of route.nodeIds) {
        const node = state.nodes.find(item => item.id === nodeId);
        if (node?.label.toLowerCase().includes(normalizedSearch)) return true;
      }
      return false;
    });
  }, [processes, ownerFilter, routes, state.nodes, statusFilter, triggerFilter, normalizedSearch]);

  const visibleProcesses = filteredProcesses.filter(
    process => processVisibility[process.id] !== false
  );

  useEffect(() => {
    if (!activeProcessId) return;
    const stillVisible = visibleProcesses.some(process => process.id === activeProcessId);
    if (!stillVisible) setActiveProcessId(null);
  }, [activeProcessId, visibleProcesses]);

  useEffect(() => {
    if (!selectedNode) return;
    const visibleNodeIds = new Set<string>();
    visibleProcesses.forEach(process => {
      const route = routes.get(process.id);
      route?.nodeIds.forEach(nodeId => visibleNodeIds.add(nodeId));
    });
    if (!visibleNodeIds.has(selectedNode.id)) {
      setDetailOpen(false);
      window.setTimeout(() => setSelectedNode(null), 200);
    }
  }, [routes, selectedNode, visibleProcesses]);

  const { flowNodes, flowEdges } = useMemo(() => {
    const nodeById = new Map(state.nodes.map(node => [node.id, node]));
    const laneById = new Map(state.lanes.map(lane => [lane.id, lane]));
    const nodeProcessColors = new Map<string, string[]>();

    const layoutEdges: Array<{ source: string; target: string }> = [];
    const layoutEdgeSet = new Set<string>();

    const flowEdges: Edge[] = [];

    visibleProcesses.forEach(process => {
      const route = routes.get(process.id);
      if (!route || route.nodeIds.size === 0) return;

      route.nodeIds.forEach(nodeId => {
        const colors = nodeProcessColors.get(nodeId) ?? [];
        if (!colors.includes(process.color)) {
          colors.push(process.color);
          nodeProcessColors.set(nodeId, colors);
        }
      });

      route.edgeIds.forEach(edgeId => {
        const edge = state.edges.find(item => item.id === edgeId);
        if (!edge) return;

        const distances = route.distances;
        const sourceDistance = distances.get(edge.source_id);
        const targetDistance = distances.get(edge.target_id);
        let layoutSource = edge.source_id;
        let layoutTarget = edge.target_id;
        if (sourceDistance !== undefined && targetDistance !== undefined) {
          if (sourceDistance > targetDistance) {
            layoutSource = edge.target_id;
            layoutTarget = edge.source_id;
          }
        }

        const layoutKey = `${layoutSource}-${layoutTarget}`;
        if (!layoutEdgeSet.has(layoutKey)) {
          layoutEdgeSet.add(layoutKey);
          layoutEdges.push({ source: layoutSource, target: layoutTarget });
        }

        flowEdges.push({
          id: `${edge.id}-${process.id}`,
          source: edge.source_id,
          target: edge.target_id,
          type: 'subwayEdge',
          data: {
            color: process.color,
            label: process.name,
            active: activeProcessId === process.id,
            dimmed: !!activeProcessId && activeProcessId !== process.id,
            showLabel: route.nodeIds.size > 4,
            processId: process.id,
          },
        });
      });
    });

    const flowNodes: Node[] = Array.from(nodeProcessColors.entries()).map(([nodeId, colors]) => {
      const node = nodeById.get(nodeId);
      if (!node) return null;
      const lane = node.lane_id ? laneById.get(node.lane_id) ?? null : null;
      const owner = resolveOwner(lane, null);
      const badge = owner && ['Arlo', 'Scott', 'External'].includes(owner) ? owner : null;
      const primaryColor = colors[0] ?? '#7c7f93';
      return {
        id: node.id,
        type: 'subwayNode',
        position: { x: 0, y: 0 },
        data: {
          label: node.label,
          description: node.description,
          schedule: node.schedule,
          nodeType: node.node_type,
          badge,
          primaryColor,
          processColors: colors,
          isShared: colors.length > 1,
          isDimmed: !!activeProcessId && !routes.get(activeProcessId)?.nodeIds.has(node.id),
        },
        draggable: false,
        selectable: true,
        style: { zIndex: 10 },
      };
    }).filter(Boolean) as Node[];

    const positionedNodes = buildLayout(flowNodes, layoutEdges);

    return { flowNodes: positionedNodes, flowEdges };
  }, [activeProcessId, routes, state.edges, state.lanes, state.nodes, visibleProcesses]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const selected = state.nodes.find(n => n.id === node.id) || null;
      setSelectedNode(selected);
      setDetailOpen(!!selected);
    },
    [state.nodes]
  );

  const handleEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    const processId = (edge.data as { processId?: string })?.processId ?? null;
    if (processId) setActiveProcessId(processId);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkflows();
    setRefreshing(false);
  }, [loadWorkflows]);

  const selectedLane = useMemo(() => {
    if (!selectedNode) return null;
    return state.lanes.find(l => l.id === selectedNode.lane_id) || null;
  }, [state.lanes, selectedNode]);

  const selectedSteps = useMemo(() => {
    if (!selectedNode) return [];
    return state.stepsByNode[selectedNode.id] || [];
  }, [selectedNode, state.stepsByNode]);

  if (state.loading && state.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-primary)] mx-auto" />
          <p className="text-sm text-gray-600">Loading subway map…</p>
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
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)] underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-background)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Workflow Subway</h2>
          <span className="text-xs text-gray-600">
            {visibleProcesses.length} line{visibleProcesses.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg text-gray-600 hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-600" />
            {TRIGGER_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setTriggerFilter(filter.id)}
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                  triggerFilter === filter.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                    : 'bg-transparent text-gray-600 border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Owner</span>
            <select
              value={ownerFilter}
              onChange={event => setOwnerFilter(event.target.value)}
              className="bg-[var(--color-surface)] text-xs text-[var(--color-text)] border border-[var(--color-border)] rounded-md px-2 py-1"
            >
              <option value="all">All</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-gray-500">Status</span>
            {STATUS_FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                  statusFilter === filter.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
                    : 'bg-transparent text-gray-600 border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search process or node"
                className="bg-[var(--color-surface)] text-xs text-[var(--color-text)] border border-[var(--color-border)] rounded-md pl-7 pr-2 py-1.5 w-48"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={() => setActiveProcessId(null)}
            fitView
            minZoom={0.3}
            maxZoom={1.7}
            panOnDrag
            nodesDraggable={false}
            style={{ background: 'var(--color-background)' }}
          >
            <Background color="#252538" gap={24} size={1} />
            <MiniMap
              pannable
              zoomable
              nodeColor={node => {
                const data = node.data as { primaryColor?: string };
                return data?.primaryColor ?? '#2b2b3f';
              }}
              maskColor="rgba(10, 10, 20, 0.6)"
            />
            <Controls />
          </ReactFlow>

          <WorkflowDetail
            node={selectedNode}
            lane={selectedLane}
            steps={selectedSteps}
            open={detailOpen}
            onClose={() => {
              setDetailOpen(false);
              window.setTimeout(() => setSelectedNode(null), 200);
            }}
          />
        </div>

        <aside className="w-72 border-l border-[var(--color-border)] bg-[var(--color-surface)] p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)]">Legend</div>
              <div className="text-xs text-gray-600">Toggle subway lines</div>
            </div>
            {activeProcessId && (
              <button
                onClick={() => setActiveProcessId(null)}
                className="text-[11px] text-[#89b4fa] hover:text-[#b4befe]"
              >
                Clear highlight
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filteredProcesses.map(process => {
              const isVisible = processVisibility[process.id] !== false;
              const isActive = activeProcessId === process.id;
              return (
                <button
                  key={process.id}
                  onClick={() => setActiveProcessId(process.id)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors',
                    isActive
                      ? 'border-[#89b4fa]/70 bg-[var(--color-surface)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border)]'
                  )}
                >
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: process.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--color-text)] truncate">{process.name}</div>
                    <div className="text-[10px] text-gray-600 truncate">
                      {process.trigger_type} · {process.owner ?? 'Unassigned'}
                    </div>
                  </div>
                  <button
                    onClick={event => {
                      event.stopPropagation();
                      setProcessVisibility(prev => ({ ...prev, [process.id]: !isVisible }));
                    }}
                    className={cn(
                      'h-6 w-6 flex items-center justify-center rounded border text-xs',
                      isVisible
                        ? 'border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)]'
                        : 'border-[var(--color-border)] text-gray-500 bg-transparent'
                    )}
                    aria-label={isVisible ? 'Hide process' : 'Show process'}
                  >
                    {isVisible && <Check size={12} />}
                  </button>
                </button>
              );
            })}

            {filteredProcesses.length === 0 && (
              <div className="text-xs text-gray-600 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
                No processes match your filters.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
