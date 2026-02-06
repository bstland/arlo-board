CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_node_id uuid REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  label text NOT NULL,
  description text,
  actor text,
  step_type text NOT NULL CHECK (step_type IN ('trigger', 'process', 'decision', 'output', 'delivery')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "steps_all" ON workflow_steps FOR ALL USING (true) WITH CHECK (true);

INSERT INTO workflow_steps (workflow_node_id, step_order, label, description, actor, step_type) VALUES
  -- Content Mining (4 AM)
  ('b1111111-1111-1111-1111-111111111111', 1, 'Cron fires', 'Cron fires at 4 AM ET.', NULL, 'trigger'),
  ('b1111111-1111-1111-1111-111111111111', 2, 'Search Reddit', 'Search Reddit (r/smallbusiness, r/entrepreneur) for pain-point threads.', NULL, 'process'),
  ('b1111111-1111-1111-1111-111111111111', 3, 'Extract themes', 'Extract questions and themes that map to Scotts frameworks.', NULL, 'process'),
  ('b1111111-1111-1111-1111-111111111111', 4, 'Draft content', 'Draft 3-5 content pieces (LinkedIn, Facebook, carousel).', NULL, 'process'),
  ('b1111111-1111-1111-1111-111111111111', 5, 'Generate images', 'Generate images via Nano Banana Pro API.', NULL, 'process'),
  ('b1111111-1111-1111-1111-111111111111', 6, 'Save deliverables', 'Save all content to deliverables/ folder.', NULL, 'output'),
  ('b1111111-1111-1111-1111-111111111111', 7, 'Log batch', 'Log batch to memory/YYYY-MM-DD.md.', NULL, 'delivery'),

  -- Daily Self-Review (5 AM)
  ('b2222222-2222-2222-2222-222222222222', 1, 'Cron fires', 'Cron fires at 5 AM ET.', NULL, 'trigger'),
  ('b2222222-2222-2222-2222-222222222222', 2, 'Run security scan', 'Run security scan (grep for leaked API keys).', NULL, 'process'),
  ('b2222222-2222-2222-2222-222222222222', 3, 'Review compliance', 'Review AGENTS.md, SOUL.md, HEARTBEAT.md compliance.', NULL, 'process'),
  ('b2222222-2222-2222-2222-222222222222', 4, 'Check memory patterns', 'Check last 3 days of memory files for patterns.', NULL, 'process'),
  ('b2222222-2222-2222-2222-222222222222', 5, 'Check kanban', 'Check kanban for stuck tasks.', NULL, 'process'),
  ('b2222222-2222-2222-2222-222222222222', 6, 'Review cron history', 'Review cron job execution history.', NULL, 'process'),
  ('b2222222-2222-2222-2222-222222222222', 7, 'Write findings', 'Write findings to memory/self-review/YYYY-MM-DD.md.', NULL, 'output'),
  ('b2222222-2222-2222-2222-222222222222', 8, 'Ping Scott if urgent', 'Ping Scott on Telegram only if urgent issues found.', NULL, 'delivery'),

  -- FMB Question Hunter (6 AM)
  ('b3333333-3333-3333-3333-333333333333', 1, 'Cron fires', 'Cron fires at 6 AM ET.', NULL, 'trigger'),
  ('b3333333-3333-3333-3333-333333333333', 2, 'Search sources', 'Search Reddit and YouTube for business owner questions.', NULL, 'process'),
  ('b3333333-3333-3333-3333-333333333333', 3, 'Filter questions', 'Filter for questions that lean toward real estate investing.', NULL, 'process'),
  ('b3333333-3333-3333-3333-333333333333', 4, 'Match frameworks', 'Match questions to Scotts frameworks (Muddy Mile, SCALE, Priority Pyramid).', NULL, 'process'),
  ('b3333333-3333-3333-3333-333333333333', 5, 'Write questions', 'Write 10 questions to deliverables/questions-fmb/YYYY-MM-DD.md.', NULL, 'output'),

  -- LinkedIn Post (6 AM M-F)
  ('b4444444-4444-4444-4444-444444444444', 1, 'Cron fires', 'Cron fires at 6 AM ET weekdays.', NULL, 'trigger'),
  ('b4444444-4444-4444-4444-444444444444', 2, 'Pull transcript', 'Pull latest podcast transcript from Captivate API.', NULL, 'process'),
  ('b4444444-4444-4444-4444-444444444444', 3, 'Extract insight', 'Extract key insight or framework.', NULL, 'process'),
  ('b4444444-4444-4444-4444-444444444444', 4, 'Draft post', 'Draft LinkedIn post in Scotts voice.', NULL, 'process'),
  ('b4444444-4444-4444-4444-444444444444', 5, 'Generate graphic concept', 'Generate graphic concept description.', NULL, 'process'),
  ('b4444444-4444-4444-4444-444444444444', 6, 'Save draft', 'Save to deliverables/linkedin/YYYY-MM-DD.md.', NULL, 'output'),
  ('b4444444-4444-4444-4444-444444444444', 7, 'Send preview', 'Send preview to Scott via Telegram.', NULL, 'delivery'),

  -- Morning Brief (7 AM)
  ('b5555555-5555-5555-5555-555555555555', 1, 'Cron fires', 'Cron fires at 7 AM ET.', NULL, 'trigger'),
  ('b5555555-5555-5555-5555-555555555555', 2, 'Query Stripe', 'Query Stripe API for yesterday revenue (3 accounts).', NULL, 'process'),
  ('b5555555-5555-5555-5555-555555555555', 3, 'Query Captivate', 'Query Captivate API for podcast downloads.', NULL, 'process'),
  ('b5555555-5555-5555-5555-555555555555', 4, 'Check Arlo Board', 'Check Arlo Board for task status.', NULL, 'process'),
  ('b5555555-5555-5555-5555-555555555555', 5, 'Compile brief', 'Compile brief with high-leverage actions.', NULL, 'process'),
  ('b5555555-5555-5555-5555-555555555555', 6, 'Send brief', 'Send formatted brief to Scott via Telegram.', NULL, 'delivery'),

  -- LGPass Portal Capture (2:05 AM)
  ('a1111111-1111-1111-1111-111111111111', 1, 'Cron fires', 'Cron fires at 2:05 AM ET (isolated agent).', NULL, 'trigger'),
  ('a1111111-1111-1111-1111-111111111111', 2, 'Launch Playwright', 'Launch headless browser via Playwright.', NULL, 'process'),
  ('a1111111-1111-1111-1111-111111111111', 3, 'Login to portal', 'Login to portal.lgpass.com.', NULL, 'process'),
  ('a1111111-1111-1111-1111-111111111111', 4, 'Scrape entity cards', 'Scrape all entity cards (bank balances, inventory, etc.).', NULL, 'process'),
  ('a1111111-1111-1111-1111-111111111111', 5, 'Save CSV', 'Save CSV to /tmp/.', NULL, 'output'),
  ('a1111111-1111-1111-1111-111111111111', 6, 'Upload to Dropbox', 'Upload CSV to Dropbox (Everland/Everland_Equity/portalHistory/).', NULL, 'delivery'),

  -- Facebook Friend Requests (8 PM)
  ('a2222222-2222-2222-2222-222222222222', 1, 'Cron fires', 'Cron fires at 8 PM ET (isolated agent).', NULL, 'trigger'),
  ('a2222222-2222-2222-2222-222222222222', 2, 'Open Facebook', 'Open Facebook via browser automation.', NULL, 'process'),
  ('a2222222-2222-2222-2222-222222222222', 3, 'Navigate to requests', 'Navigate to friend requests page.', NULL, 'process'),
  ('a2222222-2222-2222-2222-222222222222', 4, 'Check mutuals', 'For each request check mutual friends count.', NULL, 'decision'),
  ('a2222222-2222-2222-2222-222222222222', 5, 'Confirm request', 'If 3+ mutuals → Confirm and tag as Acquaintance.', NULL, 'process'),
  ('a2222222-2222-2222-2222-222222222222', 6, 'Delete request', 'If 0-2 mutuals → Delete request.', NULL, 'process'),
  ('a2222222-2222-2222-2222-222222222222', 7, 'Log results', 'Log results to memory.', NULL, 'output'),

  -- Landmodo SEO (Mon 3 AM)
  ('b6666666-6666-6666-6666-666666666666', 1, 'Cron fires', 'Cron fires Monday 3 AM ET.', NULL, 'trigger'),
  ('b6666666-6666-6666-6666-666666666666', 2, 'Query listings', 'Query landmodo-listings Supabase for active listings.', NULL, 'process'),
  ('b6666666-6666-6666-6666-666666666666', 3, 'Analyze SEO gaps', 'Analyze listings for SEO gaps (missing keywords, thin content).', NULL, 'process'),
  ('b6666666-6666-6666-6666-666666666666', 4, 'Generate report', 'Generate SEO recommendations report.', NULL, 'output'),
  ('b6666666-6666-6666-6666-666666666666', 5, 'Save deliverables', 'Save to deliverables/.', NULL, 'delivery'),

  -- Substack Article (Tue 6 AM)
  ('b7777777-7777-7777-7777-777777777777', 1, 'Cron fires', 'Cron fires Tuesday 6 AM ET.', NULL, 'trigger'),
  ('b7777777-7777-7777-7777-777777777777', 2, 'Select episode', 'Select recent podcast episode for repurposing.', NULL, 'process'),
  ('b7777777-7777-7777-7777-777777777777', 3, 'Extract frameworks', 'Extract key frameworks and stories from transcript.', NULL, 'process'),
  ('b7777777-7777-7777-7777-777777777777', 4, 'Draft article', 'Draft 800-1200 word article in Scotts voice.', NULL, 'process'),
  ('b7777777-7777-7777-7777-777777777777', 5, 'Add CTA and formatting', 'Add CTA and formatting for Substack.', NULL, 'process'),
  ('b7777777-7777-7777-7777-777777777777', 6, 'Save draft', 'Save to deliverables/substack/YYYY-MM-DD.md.', NULL, 'output'),
  ('b7777777-7777-7777-7777-777777777777', 7, 'Send preview', 'Send preview to Scott via Telegram.', NULL, 'delivery'),

  -- LGPass Sales to Airtable (Sat 4 AM)
  ('a3333333-3333-3333-3333-333333333333', 1, 'Cron fires', 'Cron fires Saturday 4 AM ET (isolated agent).', NULL, 'trigger'),
  ('a3333333-3333-3333-3333-333333333333', 2, 'Query sales', 'Query LGPass database for weekly sales.', NULL, 'process'),
  ('a3333333-3333-3333-3333-333333333333', 3, 'Format CSV', 'Format data as CSV.', NULL, 'process'),
  ('a3333333-3333-3333-3333-333333333333', 4, 'Save CSV', 'Save CSV to Dropbox.', NULL, 'output'),
  ('a3333333-3333-3333-3333-333333333333', 5, 'Email CSV', 'Send CSV via email (AgentMail).', NULL, 'process'),
  ('a3333333-3333-3333-3333-333333333333', 6, 'Push to Airtable', 'Push records to Airtable via API.', NULL, 'delivery'),

  -- Memory Audit (Sun 5 AM)
  ('b8888888-8888-8888-8888-888888888888', 1, 'Cron fires', 'Cron fires Sunday 5 AM ET.', NULL, 'trigger'),
  ('b8888888-8888-8888-8888-888888888888', 2, 'Read memory files', 'Read recent memory/YYYY-MM-DD.md files.', NULL, 'process'),
  ('b8888888-8888-8888-8888-888888888888', 3, 'Identify lessons', 'Identify significant events and lessons.', NULL, 'process'),
  ('b8888888-8888-8888-8888-888888888888', 4, 'Update MEMORY.md', 'Update MEMORY.md with distilled learnings.', NULL, 'process'),
  ('b8888888-8888-8888-8888-888888888888', 5, 'Remove outdated info', 'Remove outdated info from MEMORY.md.', NULL, 'process'),

  -- Team Reports (Mon)
  ('b9999999-9999-9999-9999-999999999999', 1, 'Cron fires', 'Cron fires Monday morning.', NULL, 'trigger'),
  ('b9999999-9999-9999-9999-999999999999', 2, 'Login to EntreLeadership', 'Login to EntreLeadership Elite.', NULL, 'process'),
  ('b9999999-9999-9999-9999-999999999999', 3, 'Check reports', 'Check weekly reports and action items.', NULL, 'process'),
  ('b9999999-9999-9999-9999-999999999999', 4, 'Compile summary', 'Compile team status summary.', NULL, 'output'),

  -- Capital Recovery (28-31st 3 AM)
  ('a4444444-4444-4444-4444-444444444444', 1, 'Cron fires', 'Cron fires end of month 3 AM ET (isolated agent).', NULL, 'trigger'),
  ('a4444444-4444-4444-4444-444444444444', 2, 'Query recovery data', 'Query LGPass for capital recovery data.', NULL, 'process'),
  ('a4444444-4444-4444-4444-444444444444', 3, 'Calculate metrics', 'Calculate recovery metrics per entity.', NULL, 'process'),
  ('a4444444-4444-4444-4444-444444444444', 4, 'Update sheets', 'Update Google Sheets with results.', NULL, 'output'),

  -- Scott Review (manual)
  ('c1111111-1111-1111-1111-111111111111', 1, 'Morning Brief arrives', 'Morning Brief arrives via Telegram.', NULL, 'trigger'),
  ('c1111111-1111-1111-1111-111111111111', 2, 'Review brief', 'Scott reads brief and reviews metrics.', NULL, 'process'),
  ('c1111111-1111-1111-1111-111111111111', 3, 'Decide priorities', 'Decides priorities for the day.', NULL, 'decision');
