# Subway Map Workflow Board — Redesign Spec

## Vision
Replace the current swim-lane workflow view with a **subway map** visualization. Think London Underground map — color-coded lines, clear stations (nodes), and visible connections showing how triggers flow through tools, people, and AI agents to produce outcomes.

## Core Concept

### The Map Layout
- **Left side:** 4 trigger columns (starting stations), color-coded:
  1. 🟡 **Time-based** (yellow line) — calendar/clock driven (cron jobs)
  2. 🔵 **Event-driven** (blue line) — webhook, form submission, status change
  3. 🟢 **Condition-based** (green line) — threshold met, balance check
  4. 🔴 **Manual** (red line) — human-initiated actions

- **Right side:** Processes flow left-to-right through stations:
  - Trigger → Tool/Service → Actor (person/AI) → Output → Delivery

### Node Types (Stations)
Each station on the map is a rounded rectangle with:
- **Icon** based on type (clock, zap, gauge, hand for triggers; tool icons for services)
- **Label** (e.g., "Stripe API", "Captivate API", "Reddit Search")
- **Color** matching its line/trigger type
- Small badge showing actor (Arlo, Scott, External)

### Edges (Lines)
- Colored lines connecting stations, like subway routes
- Lines should curve smoothly (bezier edges, not straight)
- Where processes share tools (e.g., multiple crons hit Stripe API), lines should merge/converge at that station then diverge — like subway transfers
- Decision points (if/else) shown as diamond nodes with two outgoing lines

### Process Names
Each "route" on the subway map IS a process. The process name should appear along the line, like a subway line name:
- "VA Payroll Check" line: Time trigger → Todoist (check complete) → Decision → End OR Alert
- "Morning Brief" line: Time trigger → Stripe → Captivate → Arlo Board → Compile → Telegram
- "Content Mining" line: Time trigger → Reddit → Extract → Draft → Nano Banana → Save

## Data Model Changes

### Existing tables to keep:
- `workflow_nodes` — but update `node_type` to include: `trigger_time`, `trigger_event`, `trigger_condition`, `trigger_manual`, `tool`, `actor`, `decision`, `output`, `delivery`, `end`
- `workflow_edges` — add `process_id` (links edge to a process/route), `edge_color`
- `workflow_steps` — keep for detail panel
- `lanes` — REMOVE or repurpose. No more swim lanes.

### New table:
```sql
CREATE TABLE IF NOT EXISTS workflow_processes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('time', 'event', 'condition', 'manual')),
  color text NOT NULL,  -- hex color for the subway line
  schedule text,  -- e.g., "Daily 7 AM", "Mon 3 AM"
  owner text,  -- "Arlo", "Scott", etc.
  status text DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'error')),
  created_at timestamptz DEFAULT now()
);
```

### Updated workflow_nodes:
```sql
ALTER TABLE workflow_nodes ADD COLUMN IF NOT EXISTS node_icon text;
ALTER TABLE workflow_nodes ADD COLUMN IF NOT EXISTS shared boolean DEFAULT false;
-- shared = true means multiple process lines pass through this node (transfer station)
```

### Updated workflow_edges:
```sql
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES workflow_processes(id);
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS edge_color text;
ALTER TABLE workflow_edges ADD COLUMN IF NOT EXISTS edge_order int DEFAULT 0;
```

## UI Components

### SubwayMap (main component)
- Uses `@xyflow/react` (already installed)
- Background: dark theme with subtle grid (like the current board)
- Minimap in corner showing full system
- Zoom/pan controls

### SubwayNode (custom node)
- Rounded rectangle, 160x60px
- Left color bar matching the process line color
- Icon + label
- Hover: show tooltip with description
- Click: open detail panel (existing WorkflowDetail)
- If `shared=true`: show multiple colored dots indicating which lines pass through

### SubwayEdge (custom edge)
- Smooth bezier curve
- Colored to match process
- Animated flow dots moving along the line (subtle, like data flowing)
- Label with process name on hover or always visible for main routes

### Legend/Sidebar
- List all processes (subway lines) with their colors
- Toggle visibility per process
- Filter by trigger type
- Search processes
- Show upstream/downstream (blast radius) when a node is selected

### Filters (top bar)
- Filter by trigger type (Time / Event / Condition / Manual / All)
- Filter by owner (Arlo / Scott / External / All)
- Filter by status (Active / Disabled / Error)
- Search by process or node name

## Layout Algorithm
- Auto-layout: processes flow left to right
- Trigger nodes fixed on left column
- Shared nodes (tools used by multiple processes) positioned centrally
- Use dagre or elkjs for auto-layout (add as dependency if needed)
- Allow manual repositioning (save positions to DB)

## Interactions
- **Click node:** Opens detail panel showing steps, upstream, downstream
- **Click process line:** Highlights entire route, dims others
- **Hover node:** Show tooltip + highlight all connected routes
- **Right-click node:** Context menu (edit, delete, view in detail)
- **Add process:** Wizard to create new subway line (trigger → steps → output)

## Seed Data
Use the existing `workflow_steps` seed data to generate the subway map. Map each workflow_node to a process, create edges from the step order, and assign colors:

| Process | Trigger | Color |
|---------|---------|-------|
| Content Mining | Time (4 AM) | #f9e2af |
| Daily Self-Review | Time (5 AM) | #a6e3a1 |
| FMB Question Hunter | Time (6 AM) | #89b4fa |
| LinkedIn Post | Time (6 AM M-F) | #cba6f7 |
| Morning Brief | Time (7 AM) | #f38ba8 |
| LGPass Portal Capture | Time (2:05 AM) | #fab387 |
| Facebook Friend Requests | Time (8 PM) | #74c7ec |
| Landmodo SEO | Time (Mon 3 AM) | #94e2d5 |
| Substack Article | Time (Tue 6 AM) | #f2cdcd |
| LGPass Sales | Time (Sat 4 AM) | #eba0ac |
| Memory Audit | Time (Sun 5 AM) | #b4befe |
| Capital Recovery | Time (Monthly) | #a6adc8 |
| Scott Review | Manual | #f38ba8 |
| VA Payroll Check | Time (Biweekly) | #89dceb |

## Key Requirement
**Show the CONNECTIONS.** The whole point is seeing how software, tools, people, and AI agents connect. The lines ARE the value. Where multiple processes share a tool (e.g., Stripe API, Telegram), those should converge at a shared station node — making it visually obvious that Stripe is a hub connecting Morning Brief, Revenue tracking, etc.

## Tech Stack
- Next.js 15 (existing)
- @xyflow/react (existing, already installed)
- Tailwind CSS (existing)
- Supabase (existing)
- Add: dagre or elkjs for auto-layout

## Deploy
- Netlify CLI only (NOT GitHub push)
- Site: arlo-board.netlify.app
