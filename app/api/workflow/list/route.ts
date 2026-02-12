import { NextResponse } from 'next/server';
import { supabaseRequest } from '@/lib/supabase';
import type { Lane, WorkflowNode, WorkflowEdge, WorkflowStep, WorkflowProcess } from '@/lib/types';

export async function GET() {
  try {
    const lanes = await supabaseRequest<Lane[]>({
      table: 'lanes',
      method: 'GET',
      query: 'select=*&order=sort_order.asc',
    });

    const nodes = await supabaseRequest<WorkflowNode[]>({
      table: 'workflow_nodes',
      method: 'GET',
      query: 'select=*&order=position_x.asc',
    });

    const edges = await supabaseRequest<WorkflowEdge[]>({
      table: 'workflow_edges',
      method: 'GET',
      query: 'select=*',
    });

    const processes = await supabaseRequest<WorkflowProcess[]>({
      table: 'workflow_processes',
      method: 'GET',
      query: 'select=*&order=name.asc',
    });

    const steps = await supabaseRequest<WorkflowStep[]>({
      table: 'workflow_steps',
      method: 'GET',
      query: 'select=*&order=step_order.asc',
    });

    return NextResponse.json({ lanes, nodes, edges, processes, steps });
  } catch (error) {
    console.error('Workflow list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}
