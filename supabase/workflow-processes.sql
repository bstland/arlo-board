-- Workflow processes (subway lines)
CREATE TABLE IF NOT EXISTS workflow_processes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('time', 'event', 'condition', 'manual')),
  color text NOT NULL,
  schedule text,
  owner text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'error')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_processes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_processes_all" ON workflow_processes FOR ALL USING (true) WITH CHECK (true);

-- Extend nodes for subway map
ALTER TABLE workflow_nodes ADD COLUMN IF NOT EXISTS node_icon text;
ALTER TABLE workflow_nodes ADD COLUMN IF NOT EXISTS shared boolean DEFAULT false;

-- Extend edges for subway map
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES workflow_processes(id);
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS edge_color text;
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS edge_order int DEFAULT 0;
