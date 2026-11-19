alter table public.profiles
  add column if not exists day_starts_at time not null default '07:00',
  add column if not exists day_ends_at time not null default '23:00';

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200), memo text not null default '',
  planned_date date, project_id uuid, is_completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists todos_user_date_idx on public.todos(user_id, planned_date, is_completed, created_at);

create table if not exists public.priority_slots (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  priority_date date not null, rank smallint not null check (rank between 1 and 3), todo_id uuid not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, priority_date, rank), unique(user_id, priority_date, todo_id),
  foreign key (todo_id, user_id) references public.todos(id, user_id) on delete cascade
);

create table if not exists public.brain_dumps (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  converted_todo_id uuid, converted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id, user_id), foreign key (converted_todo_id, user_id) references public.todos(id, user_id) on delete set null (converted_todo_id)
);
create index if not exists brain_dumps_user_created_idx on public.brain_dumps(user_id, created_at desc);

create table if not exists public.planned_schedule_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  todo_id uuid not null, plan_date date not null, starts_at timestamptz not null, ends_at timestamptz not null,
  google_event_id text, google_calendar_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at > starts_at), unique(user_id, todo_id, plan_date),
  foreign key (todo_id, user_id) references public.todos(id, user_id) on delete cascade
);
create index if not exists planned_schedule_user_time_idx on public.planned_schedule_entries(user_id, starts_at, ends_at);

create table if not exists public.timer_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  todo_id uuid not null, session_date date not null, status text not null default 'running' check (status in ('running','paused','completed')),
  started_at timestamptz not null default now(), paused_at timestamptz, ended_at timestamptz,
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0), manual_seconds integer check (manual_seconds is null or manual_seconds >= 0),
  note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((status = 'completed' and ended_at is not null) or status <> 'completed'),
  foreign key (todo_id, user_id) references public.todos(id, user_id) on delete cascade
);
create unique index if not exists timer_sessions_one_active_per_user on public.timer_sessions(user_id) where status in ('running','paused');
create index if not exists timer_sessions_user_date_idx on public.timer_sessions(user_id, session_date, created_at);

alter table public.todos enable row level security;
alter table public.priority_slots enable row level security;
alter table public.brain_dumps enable row level security;
alter table public.planned_schedule_entries enable row level security;
alter table public.timer_sessions enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['todos','priority_slots','brain_dumps','planned_schedule_entries','timer_sessions'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete_own', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('revoke all on public.%I from anon', table_name);
  end loop;
end $$;
