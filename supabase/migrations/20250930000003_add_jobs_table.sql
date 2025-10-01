-- Add jobs table for orchestration
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')) default 'queued',
  run_after timestamptz default now(),
  max_attempts int default 3,
  attempts int default 0,
  last_error text,
  reserved_by text,
  lease_until timestamptz,
  user_id uuid,
  run_id uuid,
  scene_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_type on jobs(type);
create index if not exists idx_jobs_run_id on jobs(run_id);
create index if not exists idx_jobs_run_after on jobs(run_after);

alter table jobs enable row level security;

-- Allow service role to manage jobs
drop policy if exists "Service role can manage jobs" on jobs;
create policy "Service role can manage jobs" on jobs for all using (true);
