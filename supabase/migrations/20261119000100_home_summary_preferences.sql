create table if not exists public.home_summary_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  summary_order jsonb not null default '["todo","checklist","memo","project"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.home_summary_preferences enable row level security;
drop policy if exists home_summary_preferences_select_own on public.home_summary_preferences;
create policy home_summary_preferences_select_own on public.home_summary_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists home_summary_preferences_insert_own on public.home_summary_preferences;
create policy home_summary_preferences_insert_own on public.home_summary_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists home_summary_preferences_update_own on public.home_summary_preferences;
create policy home_summary_preferences_update_own on public.home_summary_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.home_summary_preferences to authenticated;
revoke all on public.home_summary_preferences from anon;
