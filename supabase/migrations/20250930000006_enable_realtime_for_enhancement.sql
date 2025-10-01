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
SELECT cron.schedule(
  'process-enhancement-jobs',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.api_url') || '/functions/v1/worker-dispatch',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- For local development, set the API URL
-- In production, Supabase will use the correct public URL automatically
ALTER DATABASE postgres SET app.settings.api_url TO 'http://127.0.0.1:54321';
