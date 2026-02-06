'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { WorkflowState, WorkflowAction, Lane, WorkflowNode, WorkflowEdge, WorkflowStep } from '@/lib/types';
import * as api from '@/lib/workflow-client';

const initialState: WorkflowState = {
  lanes: [],
  nodes: [],
  edges: [],
  steps: [],
  stepsByNode: {},
  loading: false,
  error: null,
};

function groupSteps(steps: WorkflowStep[]): Record<string, WorkflowStep[]> {
  const grouped = steps.reduce<Record<string, WorkflowStep[]>>((acc, step) => {
    if (!acc[step.workflow_node_id]) acc[step.workflow_node_id] = [];
    acc[step.workflow_node_id].push(step);
    return acc;
  }, {});
  for (const stepList of Object.values(grouped)) {
    stepList.sort((a, b) => a.step_order - b.step_order);
  }
  return grouped;
}

function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        lanes: action.lanes,
        nodes: action.nodes,
        edges: action.edges,
        steps: action.steps,
        stepsByNode: groupSteps(action.steps),
        loading: false,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

interface WorkflowContextType {
  state: WorkflowState;
  loadWorkflows: () => Promise<void>;
  setData: (lanes: Lane[], nodes: WorkflowNode[], edges: WorkflowEdge[], steps: WorkflowStep[]) => void;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const loadWorkflows = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const data = await api.listWorkflows();
      dispatch({ type: 'SET_DATA', lanes: data.lanes, nodes: data.nodes, edges: data.edges, steps: data.steps });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load workflows' });
    }
  }, []);

  const setData = useCallback((lanes: Lane[], nodes: WorkflowNode[], edges: WorkflowEdge[], steps: WorkflowStep[]) => {
    dispatch({ type: 'SET_DATA', lanes, nodes, edges, steps });
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  return (
    <WorkflowContext.Provider value={{ state, loadWorkflows, setData }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
}
