create table if not exists public.schedule_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reflection_date date not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, reflection_date)
);

alter table public.schedule_reflections enable row level security;
drop policy if exists schedule_reflections_select_own on public.schedule_reflections;
create policy schedule_reflections_select_own on public.schedule_reflections for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists schedule_reflections_insert_own on public.schedule_reflections;
create policy schedule_reflections_insert_own on public.schedule_reflections for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists schedule_reflections_update_own on public.schedule_reflections;
create policy schedule_reflections_update_own on public.schedule_reflections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists schedule_reflections_delete_own on public.schedule_reflections;
create policy schedule_reflections_delete_own on public.schedule_reflections for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.schedule_reflections to authenticated;
revoke all on public.schedule_reflections from anon;
create index if not exists schedule_reflections_user_date_idx on public.schedule_reflections(user_id, reflection_date desc) where deleted_at is null;
