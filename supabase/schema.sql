-- ============================================================
-- AI Factory — Supabase schema (reference design)
-- Run in Supabase dashboard → SQL Editor. Safe to re-run.
-- Design conventions borrowed from the one-hour project:
-- idempotent DDL, RLS owner-scoped, Realtime publication with
-- replica identity full, server-side SECURITY DEFINER helpers.
-- ============================================================

-- ── Tasks: one user goal = one row ──────────────────────────────────────────

create table if not exists public.factory_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 2000),
  status text not null default 'draft'
    check (status in ('draft', 'running', 'review', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.factory_tasks replica identity full;
create index if not exists factory_tasks_owner_recent
  on public.factory_tasks (owner_id, created_at desc);
create index if not exists factory_tasks_status on public.factory_tasks (status);
alter table public.factory_tasks enable row level security;

drop policy if exists "owners may read their tasks" on public.factory_tasks;
create policy "owners may read their tasks"
  on public.factory_tasks for select using (auth.uid() = owner_id);
drop policy if exists "owners may create their tasks" on public.factory_tasks;
create policy "owners may create their tasks"
  on public.factory_tasks for insert with check (auth.uid() = owner_id);
drop policy if exists "owners may update their tasks" on public.factory_tasks;
create policy "owners may update their tasks"
  on public.factory_tasks for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
drop policy if exists "owners may delete their tasks" on public.factory_tasks;
create policy "owners may delete their tasks"
  on public.factory_tasks for delete using (auth.uid() = owner_id);

-- ── Steps: decomposed work, each routed to a production line ────────────────

create table if not exists public.factory_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.factory_tasks (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  detail text not null default '',
  pipeline text not null
    check (pipeline in ('game', 'video', 'comic', 'engine', 'general')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'done', 'failed')),
  approved boolean not null default false,
  result jsonb,
  attempt int not null default 0,
  max_attempts int not null default 3,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.factory_steps replica identity full;
create index if not exists factory_steps_task on public.factory_steps (task_id, position);
create index if not exists factory_steps_status on public.factory_steps (status);
alter table public.factory_steps enable row level security;

drop policy if exists "owners may read their steps" on public.factory_steps;
create policy "owners may read their steps"
  on public.factory_steps for select using (auth.uid() = owner_id);
drop policy if exists "owners may create their steps" on public.factory_steps;
create policy "owners may create their steps"
  on public.factory_steps for insert with check (auth.uid() = owner_id);
drop policy if exists "owners may update their steps" on public.factory_steps;
create policy "owners may update their steps"
  on public.factory_steps for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
drop policy if exists "owners may delete their steps" on public.factory_steps;
create policy "owners may delete their steps"
  on public.factory_steps for delete using (auth.uid() = owner_id);

-- ── Workflow runs: queue + execution journal (one attempt per row) ──────────

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.factory_tasks (id) on delete cascade,
  step_id uuid not null references public.factory_steps (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  workflow_id text not null check (char_length(workflow_id) between 1 and 120),
  engine text not null default 'comfyui'
    check (engine in ('comfyui', 'mcp', 'local', 'other')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  attempt int not null default 1,
  idempotency_key text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  version int not null default 0,
  unique (step_id, attempt)
);
alter table public.workflow_runs replica identity full;
create index if not exists workflow_runs_queue on public.workflow_runs (status, queued_at);
create index if not exists workflow_runs_step on public.workflow_runs (step_id);
create index if not exists workflow_runs_idempotency
  on public.workflow_runs (owner_id, idempotency_key);
alter table public.workflow_runs enable row level security;

drop policy if exists "owners may read their runs" on public.workflow_runs;
create policy "owners may read their runs"
  on public.workflow_runs for select using (auth.uid() = owner_id);
drop policy if exists "owners may create their runs" on public.workflow_runs;
create policy "owners may create their runs"
  on public.workflow_runs for insert with check (auth.uid() = owner_id);
drop policy if exists "owners may cancel their queued runs" on public.workflow_runs;
create policy "owners may cancel their queued runs"
  on public.workflow_runs for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
revoke delete on public.workflow_runs from authenticated; -- runs are an audit log

-- Retry a failed run by appending a new queued row (never mutate history).
create or replace function public.retry_failed_run(p_run_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare src public.workflow_runs; new_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into src from public.workflow_runs where id = p_run_id and owner_id = auth.uid();
  if not found or src.status <> 'failed' then raise exception 'run not retryable'; end if;
  if src.attempt >= (select max_attempts from public.factory_steps where id = src.step_id) then
    raise exception 'max attempts reached';
  end if;
  if exists (select 1 from public.workflow_runs
             where step_id = src.step_id and attempt = src.attempt + 1) then
    return null; -- already retried (idempotent)
  end if;
  insert into public.workflow_runs
    (task_id, step_id, owner_id, workflow_id, engine, input, attempt, idempotency_key)
  values
    (src.task_id, src.step_id, src.owner_id, src.workflow_id, src.engine,
     src.input, src.attempt + 1, src.idempotency_key)
  returning id into new_id;
  return new_id;
end; $$;

revoke all on function public.retry_failed_run(uuid) from public, anon;
grant execute on function public.retry_failed_run(uuid) to authenticated;

-- ── Assets: unified library with versions and QA ────────────────────────────

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.factory_tasks (id) on delete set null,
  step_id uuid references public.factory_steps (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('image', 'sprite', 'video', 'audio', 'comic', 'other')),
  uri text not null,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  qa_status text not null default 'pending'
    check (qa_status in ('pending', 'approved', 'rejected')),
  version int not null default 1,
  created_at timestamptz not null default now()
);
alter table public.assets replica identity full;
create index if not exists assets_owner_recent on public.assets (owner_id, created_at desc);
create index if not exists assets_task on public.assets (task_id);
create index if not exists assets_kind on public.assets (kind);
alter table public.assets enable row level security;

drop policy if exists "owners may read their assets" on public.assets;
create policy "owners may read their assets"
  on public.assets for select using (auth.uid() = owner_id);
drop policy if exists "owners may create their assets" on public.assets;
create policy "owners may create their assets"
  on public.assets for insert with check (auth.uid() = owner_id);
drop policy if exists "owners may update their assets" on public.assets;
create policy "owners may update their assets"
  on public.assets for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
drop policy if exists "owners may delete their assets" on public.assets;
create policy "owners may delete their assets"
  on public.assets for delete using (auth.uid() = owner_id);

create table if not exists public.asset_versions (
  asset_id uuid not null references public.assets (id) on delete cascade,
  version int not null check (version > 0),
  uri text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (asset_id, version)
);
alter table public.asset_versions enable row level security;
drop policy if exists "owners may read their asset versions" on public.asset_versions;
create policy "owners may read their asset versions"
  on public.asset_versions for select using (
    exists (select 1 from public.assets a
            where a.id = asset_id and a.owner_id = auth.uid())
  );
revoke insert, update, delete on public.asset_versions from anon, authenticated;
-- Version writes go through a SECURITY DEFINER function (to be added with the
-- Storage adapter); no direct client writes.

-- ── Realtime: stream task/step/run/asset state to the UI ─────────────────────

do $$
begin
  alter publication supabase_realtime add table public.factory_tasks;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.factory_steps;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.workflow_runs;
exception when duplicate_object then null; end $$;
do $$
begin
  alter publication supabase_realtime add table public.assets;
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on public.factory_tasks,
  public.factory_steps, public.assets to authenticated;
grant select, insert, update on public.workflow_runs to authenticated;
revoke all on public.factory_tasks, public.factory_steps,
  public.workflow_runs, public.assets, public.asset_versions from anon;
