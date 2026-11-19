alter table public.brain_dumps add column if not exists is_completed boolean not null default false;
alter table public.planned_schedule_entries add column if not exists source_type text not null default 'todo';
alter table public.planned_schedule_entries add column if not exists source_id text;
alter table public.planned_schedule_entries alter column todo_id drop not null;
alter table public.planned_schedule_entries drop constraint if exists planned_schedule_source_check;
alter table public.planned_schedule_entries add constraint planned_schedule_source_check check (source_type in ('todo','google','brain_dump'));
alter table public.planned_schedule_entries drop constraint if exists planned_schedule_source_required;
alter table public.planned_schedule_entries add constraint planned_schedule_source_required check ((source_type='todo' and todo_id is not null) or (source_type<>'todo' and source_id is not null));
create table if not exists public.schedule_completions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  completion_date date not null, source_type text not null check(source_type in ('todo','google','brain_dump')), source_id text not null,
  completed_at timestamptz not null default now(), unique(user_id,completion_date,source_type,source_id), unique(id,user_id)
);
alter table public.schedule_completions enable row level security;
drop policy if exists schedule_completions_select_own on public.schedule_completions; drop policy if exists schedule_completions_insert_own on public.schedule_completions; drop policy if exists schedule_completions_update_own on public.schedule_completions; drop policy if exists schedule_completions_delete_own on public.schedule_completions;
create policy schedule_completions_select_own on public.schedule_completions for select to authenticated using((select auth.uid())=user_id);
create policy schedule_completions_insert_own on public.schedule_completions for insert to authenticated with check((select auth.uid())=user_id);
create policy schedule_completions_update_own on public.schedule_completions for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy schedule_completions_delete_own on public.schedule_completions for delete to authenticated using((select auth.uid())=user_id);
grant select,insert,update,delete on public.schedule_completions to authenticated; revoke all on public.schedule_completions from anon;
