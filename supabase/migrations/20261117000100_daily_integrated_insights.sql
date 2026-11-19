create table if not exists public.daily_integrated_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_date date not null,
  status text not null default 'pending' check (status in ('pending', 'ready', 'no_data', 'failed')),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  clues jsonb not null default '[]'::jsonb,
  adjustments jsonb not null default '[]'::jsonb,
  next_action text,
  question text,
  source_snapshot jsonb not null default '[]'::jsonb,
  consent_snapshot jsonb not null default '{}'::jsonb,
  model text,
  prompt_version text,
  error_message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_date),
  unique (id, user_id)
);

create table if not exists public.daily_insight_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_id uuid not null,
  answer text not null check (char_length(btrim(answer)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_id),
  constraint daily_insight_answers_insight_owner_fkey
    foreign key (insight_id, user_id)
    references public.daily_integrated_insights (id, user_id)
    on delete cascade
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  insight_id uuid,
  title text not null,
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_insight_owner_fkey
    foreign key (insight_id, user_id)
    references public.daily_integrated_insights (id, user_id)
    on delete cascade
);

create unique index if not exists notifications_insight_type_unique
  on public.notifications (user_id, notification_type, insight_id)
  where insight_id is not null;

create index if not exists daily_integrated_insights_user_date_idx
  on public.daily_integrated_insights (user_id, insight_date desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

alter table public.daily_integrated_insights enable row level security;
alter table public.daily_insight_answers enable row level security;
alter table public.notifications enable row level security;

drop policy if exists daily_integrated_insights_select_own on public.daily_integrated_insights;
drop policy if exists daily_integrated_insights_insert_own on public.daily_integrated_insights;
drop policy if exists daily_integrated_insights_update_own on public.daily_integrated_insights;
create policy daily_integrated_insights_select_own on public.daily_integrated_insights
  for select to authenticated using ((select auth.uid()) = user_id);
create policy daily_integrated_insights_insert_own on public.daily_integrated_insights
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy daily_integrated_insights_update_own on public.daily_integrated_insights
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists daily_insight_answers_select_own on public.daily_insight_answers;
drop policy if exists daily_insight_answers_insert_own on public.daily_insight_answers;
drop policy if exists daily_insight_answers_update_own on public.daily_insight_answers;
create policy daily_insight_answers_select_own on public.daily_insight_answers
  for select to authenticated using ((select auth.uid()) = user_id);
create policy daily_insight_answers_insert_own on public.daily_insight_answers
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy daily_insight_answers_update_own on public.daily_insight_answers
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notifications_update_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.daily_integrated_insights to authenticated;
grant select, insert, update on public.daily_insight_answers to authenticated;
grant select, update on public.notifications to authenticated;
revoke all on public.daily_integrated_insights from anon;
revoke all on public.daily_insight_answers from anon;
revoke all on public.notifications from anon;
