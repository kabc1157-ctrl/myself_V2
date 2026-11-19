create table if not exists public.workplaces (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, default_pay_type text not null default 'hourly' check (default_pay_type in ('hourly','daily','per_task','bonus')),
  default_rate numeric not null default 0 check (default_rate >= 0), pay_period_start_day smallint not null default 1 check (pay_period_start_day between 1 and 28),
  pay_day smallint not null default 10 check (pay_day between 1 and 31), end_date date, default_start_time time, default_end_time time,
  default_break_minutes integer not null default 0 check (default_break_minutes between 0 and 1439), color text not null default 'apricot',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(), workplace_id uuid not null references public.workplaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, work_date date not null, start_time time, end_time time,
  break_minutes integer not null default 0 check (break_minutes between 0 and 1439), pay_type text not null check (pay_type in ('hourly','daily','per_task','bonus')),
  pay_rate numeric not null check (pay_rate >= 0), quantity numeric not null default 1 check (quantity > 0), additional_pay numeric not null default 0 check (additional_pay >= 0),
  memo text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check ((start_time is null and end_time is null) or (start_time is not null and end_time is not null))
);
alter table public.workplaces enable row level security; alter table public.work_shifts enable row level security;
drop policy if exists workplaces_select_own on public.workplaces; create policy workplaces_select_own on public.workplaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists workplaces_insert_own on public.workplaces; create policy workplaces_insert_own on public.workplaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists workplaces_update_own on public.workplaces; create policy workplaces_update_own on public.workplaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists workplaces_delete_own on public.workplaces; create policy workplaces_delete_own on public.workplaces for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists work_shifts_select_own on public.work_shifts; create policy work_shifts_select_own on public.work_shifts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists work_shifts_insert_own on public.work_shifts; create policy work_shifts_insert_own on public.work_shifts for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.workplaces w where w.id = workplace_id and w.user_id = (select auth.uid())));
drop policy if exists work_shifts_update_own on public.work_shifts; create policy work_shifts_update_own on public.work_shifts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists work_shifts_delete_own on public.work_shifts; create policy work_shifts_delete_own on public.work_shifts for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists workplaces_user_active_idx on public.workplaces(user_id, created_at) where deleted_at is null;
create index if not exists work_shifts_user_date_idx on public.work_shifts(user_id, work_date desc) where deleted_at is null;
grant select, insert, update, delete on public.workplaces, public.work_shifts to authenticated;
revoke all on public.workplaces, public.work_shifts from anon;
