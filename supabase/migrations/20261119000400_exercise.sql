create table if not exists public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_date date not null,
  exercise_type text not null check (exercise_type in ('cardio','strength','stretching')),
  focus_area text not null default '',
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id)
);
create index if not exists exercise_records_user_date on public.exercise_records(user_id, exercise_date desc, created_at desc) where deleted_at is null;
create index if not exists exercise_records_user_type_date on public.exercise_records(user_id, exercise_type, exercise_date) where deleted_at is null;
alter table public.exercise_records enable row level security;
drop policy if exists exercise_records_select_own on public.exercise_records;
drop policy if exists exercise_records_insert_own on public.exercise_records;
drop policy if exists exercise_records_update_own on public.exercise_records;
drop policy if exists exercise_records_delete_own on public.exercise_records;
create policy exercise_records_select_own on public.exercise_records for select to authenticated using ((select auth.uid()) = user_id);
create policy exercise_records_insert_own on public.exercise_records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy exercise_records_update_own on public.exercise_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy exercise_records_delete_own on public.exercise_records for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.exercise_records to authenticated;
revoke all on public.exercise_records from anon;
