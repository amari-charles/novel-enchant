-- Add enhancement_runs and scenes tables for the new orchestration system

-- Enhancement runs table
create table if not exists enhancement_runs (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade,
  status text not null check (status in ('queued', 'analyzing', 'generating', 'completed', 'failed')) default 'queued',
  pipeline_version text not null,
  text_provider text not null,
  image_provider text not null,
  moderation_provider text not null,
  consistency_policy text not null,
  style_preset text,
  config jsonb,
  error text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scenes table
create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  enhancement_run_id uuid references enhancement_runs(id) on delete cascade,
  idx int not null,
  title text,
  description text not null,
  characters jsonb,
  status text not null check (status in ('pending', 'generating', 'completed', 'failed')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scene images table
create table if not exists scene_images (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid references scenes(id) on delete cascade,
  attempt int not null,
  prompt jsonb not null,
  provider text not null,
  status text not null check (status in ('queued', 'generating', 'completed', 'failed')) default 'queued',
  storage_path text,
  width int,
  height int,
  format text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Scenes current image junction table
create table if not exists scenes_current_image (
  scene_id uuid primary key references scenes(id) on delete cascade,
  image_id uuid references scene_images(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs table for job orchestration
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
  run_id uuid references enhancement_runs(id) on delete cascade,
  scene_id uuid references scenes(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_enhancement_runs_chapter_id on enhancement_runs(chapter_id);
create index if not exists idx_enhancement_runs_status on enhancement_runs(status);
create index if not exists idx_scenes_enhancement_run_id on scenes(enhancement_run_id);
create index if not exists idx_scenes_idx on scenes(idx);
create index if not exists idx_scene_images_scene_id on scene_images(scene_id);
create index if not exists idx_scene_images_attempt on scene_images(attempt);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_type on jobs(type);
create index if not exists idx_jobs_run_id on jobs(run_id);
create index if not exists idx_jobs_run_after on jobs(run_after);

-- Enable RLS
alter table enhancement_runs enable row level security;
alter table scenes enable row level security;
alter table scene_images enable row level security;
alter table scenes_current_image enable row level security;
alter table jobs enable row level security;

-- RLS policies for enhancement_runs (via chapter ownership)
create policy "Users can view runs of own chapters" on enhancement_runs for select using (
  chapter_id in (
    select c.id from chapters c
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can insert runs for own chapters" on enhancement_runs for insert with check (
  chapter_id in (
    select c.id from chapters c
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can update runs of own chapters" on enhancement_runs for update using (
  chapter_id in (
    select c.id from chapters c
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

-- RLS policies for scenes (via enhancement run ownership)
create policy "Users can view scenes of own runs" on scenes for select using (
  enhancement_run_id in (
    select r.id from enhancement_runs r
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can insert scenes to own runs" on scenes for insert with check (
  enhancement_run_id in (
    select r.id from enhancement_runs r
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can update scenes of own runs" on scenes for update using (
  enhancement_run_id in (
    select r.id from enhancement_runs r
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

-- RLS policies for scene_images (via scene ownership)
create policy "Users can view images of own scenes" on scene_images for select using (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can insert images to own scenes" on scene_images for insert with check (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can update images of own scenes" on scene_images for update using (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

-- RLS policies for scenes_current_image (via scene ownership)
create policy "Users can view current images of own scenes" on scenes_current_image for select using (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can insert current images for own scenes" on scenes_current_image for insert with check (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

create policy "Users can update current images of own scenes" on scenes_current_image for update using (
  scene_id in (
    select sc.id from scenes sc
    join enhancement_runs r on sc.enhancement_run_id = r.id
    join chapters c on r.chapter_id = c.id
    join stories s on c.story_id = s.id
    where s.user_id = auth.uid()
  )
);

-- Jobs policies - service role only for now (workers need to access jobs)
create policy "Service role can manage jobs" on jobs for all using (auth.role() = 'service_role');
