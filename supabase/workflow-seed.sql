-- Workflow lanes
CREATE TABLE IF NOT EXISTS lanes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  sort_order int NOT NULL
);

-- Workflow nodes
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lane_id uuid REFERENCES lanes(id),
  label text NOT NULL,
  schedule text,
  description text,
  node_type text NOT NULL CHECK (node_type IN ('cron', 'skill', 'manual', 'external')),
  position_x float DEFAULT 0,
  position_y float DEFAULT 0
);

-- Workflow edges
CREATE TABLE IF NOT EXISTS workflow_edges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id uuid REFERENCES workflow_nodes(id),
  target_id uuid REFERENCES workflow_nodes(id),
  label text
);

-- RLS policies (match tasks table pattern)
ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lanes_all" ON lanes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nodes_all" ON workflow_nodes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "edges_all" ON workflow_edges FOR ALL USING (true) WITH CHECK (true);

-- Seed lanes
INSERT INTO lanes (id, name, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Scott', '#89b4fa', 0),
  ('22222222-2222-2222-2222-222222222222', 'Arlo Main', '#a6e3a1', 1),
  ('33333333-3333-3333-3333-333333333333', 'Arlo Isolated', '#f9e2af', 2),
  ('44444444-4444-4444-4444-444444444444', 'External', '#f38ba8', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed nodes
INSERT INTO workflow_nodes (id, lane_id, label, schedule, description, node_type, position_x, position_y) VALUES
  -- Scott
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Scott Review', NULL, 'Reads and reviews the Morning Brief delivery.', 'manual', 0, 0),

  -- Arlo Main (daily)
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Content Mining', '4 AM', 'Extracts content ideas and drafts deliverables.', 'cron', 0, 0),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Daily Self-Review', '5 AM', 'Daily reflection and capture to memory.', 'cron', 0, 0),
  ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'FMB Question Hunter', '6 AM', 'Finds questions to fuel deliverables.', 'cron', 0, 0),
  ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'LinkedIn Post', '6 AM M-F', 'Publishes LinkedIn content.', 'cron', 0, 0),
  ('b5555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Morning Brief', '7 AM', 'Compiles metrics and updates into a daily brief.', 'cron', 0, 0),

  -- Arlo Main (weekly)
  ('b6666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Landmodo SEO', 'Mon 3 AM', 'Weekly SEO updates and tasks.', 'cron', 0, 0),
  ('b7777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Substack Article', 'Tue 6 AM', 'Drafts and publishes Substack article.', 'cron', 0, 0),
  ('b8888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'Memory Audit', 'Sun 5 AM', 'Weekly memory review and cleanup.', 'cron', 0, 0),
  ('b9999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'Team Reports', 'Mon', 'Builds leadership and team reports.', 'cron', 0, 0),

  -- Arlo Isolated (daily/weekly/monthly)
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'LGPass Portal Capture', '2:05 AM', 'Captures portal data and exports.', 'cron', 0, 0),
  ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Facebook Friend Requests', '8 PM', 'Processes incoming friend requests.', 'cron', 0, 0),
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'LGPass Sales to Airtable', 'Sat 4 AM', 'Syncs sales data to Airtable and Dropbox.', 'cron', 0, 0),
  ('a4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Capital Recovery', '28-31st 3 AM', 'Monthly capital recovery run.', 'cron', 0, 0),

  -- External nodes
  ('e1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Dropbox', NULL, 'External storage output.', 'external', 0, 0),
  ('e2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Deliverables', NULL, 'Published deliverables output.', 'external', 0, 0),
  ('e3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'Memory', NULL, 'Memory system updates.', 'external', 0, 0),
  ('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Stripe API', NULL, 'Stripe metrics source.', 'external', 0, 0),
  ('e5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Captivate API', NULL, 'Captivate metrics source.', 'external', 0, 0),
  ('e6666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'Arlo Board', NULL, 'Board metrics source.', 'external', 0, 0),
  ('e7777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'Telegram', NULL, 'Morning brief delivery destination.', 'external', 0, 0),
  ('e8888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 'Browser', NULL, 'External browser automation.', 'external', 0, 0),
  ('e9999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 'Airtable', NULL, 'Airtable destination.', 'external', 0, 0),
  ('eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'EntreLeadership', NULL, 'Team data source.', 'external', 0, 0),
  ('ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'Google Sheets', NULL, 'Capital recovery export.', 'external', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Seed edges
INSERT INTO workflow_edges (id, source_id, target_id, label) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'outputs'),
  ('f2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'outputs'),
  ('f3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'updates'),
  ('f4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'outputs'),
  ('f5555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', 'outputs'),
  ('f6666666-6666-6666-6666-666666666666', 'e4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 'reads'),
  ('f7777777-7777-7777-7777-777777777777', 'e5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'reads'),
  ('f8888888-8888-8888-8888-888888888888', 'e6666666-6666-6666-6666-666666666666', 'b5555555-5555-5555-5555-555555555555', 'reads'),
  ('f9999999-9999-9999-9999-999999999999', 'b5555555-5555-5555-5555-555555555555', 'e7777777-7777-7777-7777-777777777777', 'delivers'),
  ('faaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e7777777-7777-7777-7777-777777777777', 'c1111111-1111-1111-1111-111111111111', 'reviewed'),
  ('fbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a2222222-2222-2222-2222-222222222222', 'e8888888-8888-8888-8888-888888888888', 'uses'),
  ('fccccccc-cccc-cccc-cccc-cccccccccccc', 'a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'outputs'),
  ('fddddddd-dddd-dddd-dddd-dddddddddddd', 'a3333333-3333-3333-3333-333333333333', 'e9999999-9999-9999-9999-999999999999', 'outputs'),
  ('feeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'b9999999-9999-9999-9999-999999999999', 'reads'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'a4444444-4444-4444-4444-444444444444', 'ebbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'outputs')
ON CONFLICT (id) DO NOTHING;
