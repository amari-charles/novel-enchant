-- Enable Realtime for enhancement tables
-- This allows frontend to subscribe to real-time updates without polling

-- Enable realtime for enhancement_runs table
ALTER PUBLICATION supabase_realtime ADD TABLE enhancement_runs;

-- Enable realtime for scenes table
ALTER PUBLICATION supabase_realtime ADD TABLE scenes;

-- Note: RLS policies already exist for these tables, so users can only
-- subscribe to updates for runs/scenes they own

-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule worker-dispatch to run every minute
-- This uses pg_cron + pg_net to call the worker-dispatch edge function
-- Note: Unschedule first if exists to avoid duplicates
SELECT cron.unschedule('process-enhancement-jobs') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-enhancement-jobs'
);

SELECT cron.schedule(
  'process-enhancement-jobs',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://cquunkrscfpocntjekfq.supabase.co/functions/v1/worker-dispatch',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdXVua3JzY2Zwb2NudGpla2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTExMjQ2NCwiZXhwIjoyMDc0Njg4NDY0fQ.hj8ZR0yHIDVtVFsSjxpq7dRr07TP8sD4a8vQ1S5quPA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
