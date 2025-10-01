-- Comprehensive schema for Novel Enchant new architecture
-- This migration creates all tables needed by the current codebase

-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Core stories and chapters (used by shelf-enhance.service.ts)
create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  created_at timestamptz default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade,
  idx int not null,
  raw_text text not null,
  created_at timestamptz default now()
);

-- Enhanced copies (used extensively by ShelfPage)
create table if not exists enhanced_copies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  enhanced_content jsonb,
  original_content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enhancement jobs (used by Supabase functions)
create table if not exists enhance_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  input_text text,
  job_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enhancement engine tables (used by SupabaseEnhancementService)

-- Works table for the enhancement engine
create table if not exists works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  style_preferences jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Anchors for image positioning in text
create table if not exists anchors (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references chapters(id) on delete cascade,
  work_id uuid references works(id) on delete cascade,
  position int not null,
  active_image_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prompts for image generation
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  anchor_id uuid references anchors(id) on delete cascade,
  version int not null default 1,
  body text not null,
  ref_ids text[] default '{}',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated images
create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  anchor_id uuid references anchors(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  url text not null,
  status text not null check (status in ('queued', 'generating', 'completed', 'failed')) default 'queued',
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Characters detected/managed in stories
create table if not exists characters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid references works(id) on delete cascade,
  name text not null,
  short_desc text,
  description text,
  aliases text[] default '{}',
  status text not null check (status in ('candidate', 'confirmed', 'ignored')) default 'candidate',
  confidence decimal(3,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Debug logging table
create table if not exists debug_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  message text not null,
  context jsonb,
  created_at timestamptz default now()
);

-- Add foreign key constraint for active_image_id in anchors
alter table anchors add constraint fk_anchors_active_image foreign key (active_image_id) references images(id) on delete set null;

-- Create indexes for performance
create index if not exists idx_stories_user_id on stories(user_id);
create index if not exists idx_chapters_story_id on chapters(story_id);
create index if not exists idx_enhanced_copies_user_id on enhanced_copies(user_id);
create index if not exists idx_enhance_jobs_user_id on enhance_jobs(user_id);
create index if not exists idx_enhance_jobs_status on enhance_jobs(status);
create index if not exists idx_works_user_id on works(user_id);
create index if not exists idx_anchors_chapter_id on anchors(chapter_id);
create index if not exists idx_anchors_work_id on anchors(work_id);
create index if not exists idx_prompts_anchor_id on prompts(anchor_id);
create index if not exists idx_images_anchor_id on images(anchor_id);
create index if not exists idx_images_prompt_id on images(prompt_id);
create index if not exists idx_characters_work_id on characters(work_id);
create index if not exists idx_debug_logs_created_at on debug_logs(created_at);

-- Create storage bucket for enhanced copies (if it doesn't exist)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enhanced-copies', 'enhanced-copies', false, 52428800, array['text/plain', 'text/html', 'application/json'])
on conflict (id) do nothing;

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
alter table stories enable row level security;
alter table chapters enable row level security;
alter table enhanced_copies enable row level security;
alter table enhance_jobs enable row level security;
alter table works enable row level security;
alter table anchors enable row level security;
alter table prompts enable row level security;
alter table images enable row level security;
alter table characters enable row level security;
alter table debug_logs enable row level security;

-- Stories policies
create policy "Users can view own stories" on stories for select using (auth.uid() = user_id);
create policy "Users can insert own stories" on stories for insert with check (auth.uid() = user_id);
create policy "Users can update own stories" on stories for update using (auth.uid() = user_id);
create policy "Users can delete own stories" on stories for delete using (auth.uid() = user_id);

-- Chapters policies
create policy "Users can view chapters of own stories" on chapters for select using (
  story_id in (select id from stories where user_id = auth.uid())
);
create policy "Users can insert chapters to own stories" on chapters for insert with check (
  story_id in (select id from stories where user_id = auth.uid())
);
create policy "Users can update chapters of own stories" on chapters for update using (
  story_id in (select id from stories where user_id = auth.uid())
);
create policy "Users can delete chapters of own stories" on chapters for delete using (
  story_id in (select id from stories where user_id = auth.uid())
);

-- Enhanced copies policies
create policy "Users can view own enhanced copies" on enhanced_copies for select using (auth.uid() = user_id);
create policy "Users can insert own enhanced copies" on enhanced_copies for insert with check (auth.uid() = user_id);
create policy "Users can update own enhanced copies" on enhanced_copies for update using (auth.uid() = user_id);
create policy "Users can delete own enhanced copies" on enhanced_copies for delete using (auth.uid() = user_id);

-- Enhance jobs policies
create policy "Users can view own enhance jobs" on enhance_jobs for select using (auth.uid() = user_id);
create policy "Users can insert own enhance jobs" on enhance_jobs for insert with check (auth.uid() = user_id);
create policy "Users can update own enhance jobs" on enhance_jobs for update using (auth.uid() = user_id);

-- Works policies
create policy "Users can view own works" on works for select using (auth.uid() = user_id);
create policy "Users can insert own works" on works for insert with check (auth.uid() = user_id);
create policy "Users can update own works" on works for update using (auth.uid() = user_id);
create policy "Users can delete own works" on works for delete using (auth.uid() = user_id);

-- Anchors policies (via work ownership)
create policy "Users can view anchors of own works" on anchors for select using (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can insert anchors to own works" on anchors for insert with check (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can update anchors of own works" on anchors for update using (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can delete anchors of own works" on anchors for delete using (
  work_id in (select id from works where user_id = auth.uid())
);

-- Prompts policies (via anchor ownership)
create policy "Users can view prompts of own anchors" on prompts for select using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can insert prompts to own anchors" on prompts for insert with check (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can update prompts of own anchors" on prompts for update using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can delete prompts of own anchors" on prompts for delete using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);

-- Images policies (via anchor ownership)
create policy "Users can view images of own anchors" on images for select using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can insert images to own anchors" on images for insert with check (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can update images of own anchors" on images for update using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);
create policy "Users can delete images of own anchors" on images for delete using (
  anchor_id in (
    select a.id from anchors a
    join works w on a.work_id = w.id
    where w.user_id = auth.uid()
  )
);

-- Characters policies (via work ownership)
create policy "Users can view characters of own works" on characters for select using (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can insert characters to own works" on characters for insert with check (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can update characters of own works" on characters for update using (
  work_id in (select id from works where user_id = auth.uid())
);
create policy "Users can delete characters of own works" on characters for delete using (
  work_id in (select id from works where user_id = auth.uid())
);

-- Debug logs policies (authenticated users can insert, admins can view all)
create policy "Authenticated users can insert debug logs" on debug_logs for insert with check (auth.role() = 'authenticated');
create policy "Service role can view all debug logs" on debug_logs for select using (auth.role() = 'service_role');