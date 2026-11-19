create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text not null default '',
  emotion_emoji text not null default '🙂',
  emotion_score smallint not null check (emotion_score between 1 and 5),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.diary_entries enable row level security;
create policy "diary_entries_select_own" on public.diary_entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "diary_entries_insert_own" on public.diary_entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "diary_entries_update_own" on public.diary_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "diary_entries_delete_own" on public.diary_entries for delete to authenticated using ((select auth.uid()) = user_id);

create table public.routine_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  period text not null check (period in ('morning', 'afternoon', 'evening')),
  weekdays smallint[] not null default '{}',
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (weekdays <@ array[0,1,2,3,4,5,6]::smallint[])
);
alter table public.routine_definitions enable row level security;
create policy "routine_definitions_select_own" on public.routine_definitions for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_definitions_insert_own" on public.routine_definitions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routine_definitions_update_own" on public.routine_definitions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "routine_definitions_delete_own" on public.routine_definitions for delete to authenticated using ((select auth.uid()) = user_id);

create table public.routine_occurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routine_definitions(id) on delete cascade,
  occurrence_date date not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, occurrence_date)
);
alter table public.routine_occurrences enable row level security;
create policy "routine_occurrences_select_own" on public.routine_occurrences for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_occurrences_insert_own" on public.routine_occurrences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routine_occurrences_update_own" on public.routine_occurrences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "routine_occurrences_delete_own" on public.routine_occurrences for delete to authenticated using ((select auth.uid()) = user_id);

create table public.routine_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references public.routine_definitions(id) on delete cascade,
  reflection_date date not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.routine_reflections enable row level security;
create policy "routine_reflections_select_own" on public.routine_reflections for select to authenticated using ((select auth.uid()) = user_id);
create policy "routine_reflections_insert_own" on public.routine_reflections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "routine_reflections_update_own" on public.routine_reflections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "routine_reflections_delete_own" on public.routine_reflections for delete to authenticated using ((select auth.uid()) = user_id);

create index diary_entries_user_date_idx on public.diary_entries (user_id, entry_date desc) where deleted_at is null;
create index routine_occurrences_user_date_idx on public.routine_occurrences (user_id, occurrence_date desc);
create index routine_definitions_user_period_idx on public.routine_definitions (user_id, period) where deleted_at is null;
