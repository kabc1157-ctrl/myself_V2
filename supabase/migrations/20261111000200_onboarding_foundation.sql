alter table public.profiles add column if not exists week_starts_on text not null default 'monday' check (week_starts_on in ('monday', 'sunday'));
alter table public.profiles add column if not exists onboarding_step text not null default 'profile' check (onboarding_step in ('profile', 'assessment', 'modules', 'consents', 'result', 'completed'));
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.module_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  ai_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, module_key)
);
alter table public.module_preferences enable row level security;
create policy "module_preferences_select_own" on public.module_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "module_preferences_insert_own" on public.module_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "module_preferences_update_own" on public.module_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.ai_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_key text not null,
  consented boolean not null default false,
  version text not null default 'v1',
  updated_at timestamptz not null default now(),
  unique (user_id, consent_key)
);
alter table public.ai_consents enable row level security;
create policy "ai_consents_select_own" on public.ai_consents for select to authenticated using ((select auth.uid()) = user_id);
create policy "ai_consents_insert_own" on public.ai_consents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ai_consents_update_own" on public.ai_consents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.personality_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version text not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'locked', 'completed')),
  answers_json jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, version)
);
alter table public.personality_assessments enable row level security;
create policy "personality_assessments_select_own" on public.personality_assessments for select to authenticated using ((select auth.uid()) = user_id);
create policy "personality_assessments_insert_own" on public.personality_assessments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "personality_assessments_update_own" on public.personality_assessments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
