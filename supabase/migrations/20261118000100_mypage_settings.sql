-- 07단계 마이페이지 설정. V2 원격 DB에는 별도 승인 전 적용하지 않는다.
alter table public.profiles
  add column if not exists ai_feedback_style text not null default 'empathetic'
    check (ai_feedback_style in ('empathetic', 'problem_solving')),
  add column if not exists sleep_starts_at time,
  add column if not exists sleep_ends_at time;

create table if not exists public.navigation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  module_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.navigation_preferences enable row level security;
drop policy if exists navigation_preferences_select_own on public.navigation_preferences;
create policy navigation_preferences_select_own on public.navigation_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists navigation_preferences_insert_own on public.navigation_preferences;
create policy navigation_preferences_insert_own on public.navigation_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists navigation_preferences_update_own on public.navigation_preferences;
create policy navigation_preferences_update_own on public.navigation_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.navigation_preferences to authenticated;
revoke all on public.navigation_preferences from anon;
