-- IEUMSAE V2 P0: one assessment per account, explicit skip state, immutable completed results.
-- This migration is additive and does not delete existing assessment answers.
alter table public.profiles
  drop constraint if exists profiles_assessment_status_check;
alter table public.profiles
  add constraint profiles_assessment_status_check
  check (assessment_status in ('not_started', 'skipped', 'in_progress', 'completed'));

alter table public.personality_assessments
  add column if not exists scores_json jsonb,
  add column if not exists interpretation_version text,
  add column if not exists report_json jsonb;

-- The existing UNIQUE (user_id, version) alone permits multiple versions per account.
-- Creating this index must fail rather than discard data if duplicates already exist.
create unique index if not exists personality_assessments_one_per_user_idx
  on public.personality_assessments (user_id);

-- Only the trusted completion flow in a later step will populate completed results.
-- Drafts must not carry fabricated scores or reports.
alter table public.personality_assessments
  add constraint personality_assessments_result_state_check
  check (
    (status = 'in_progress'
      and completed_at is null
      and scores_json is null
      and interpretation_version is null
      and report_json is null)
    or (status = 'locked')
    or (status = 'completed'
      and completed_at is not null
      and scores_json is not null
      and jsonb_typeof(scores_json) = 'object'
      and interpretation_version is not null
      and length(trim(interpretation_version)) > 0
      and report_json is not null
      and jsonb_typeof(report_json) = 'object')
  ) not valid;

-- A completed assessment remains immutable even for privileged app writes.
create or replace function public.guard_personality_assessment_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('completed', 'locked') then
      raise exception 'Completed personality assessments cannot be deleted';
    end if;
    return old;
  end if;

  if old.status in ('completed', 'locked') then
    raise exception 'Completed personality assessments cannot be changed';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Personality assessment ownership cannot change';
  end if;

  return new;
end;
$$;

drop trigger if exists personality_assessment_immutable on public.personality_assessments;
create trigger personality_assessment_immutable
before update or delete on public.personality_assessments
for each row execute function public.guard_personality_assessment_mutation();

drop policy if exists personality_assessments_insert_own on public.personality_assessments;
create policy personality_assessments_insert_own
on public.personality_assessments
for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'in_progress');

drop policy if exists personality_assessments_update_own on public.personality_assessments;
create policy personality_assessments_update_own
on public.personality_assessments
for update to authenticated
using ((select auth.uid()) = user_id and status = 'in_progress')
with check ((select auth.uid()) = user_id and status = 'in_progress');

-- No client-side delete or direct completion. The later scoring step will use
-- a trusted server-only completion path after validating all 35 answers.
revoke delete on public.personality_assessments from anon, authenticated;
revoke execute on function public.guard_personality_assessment_mutation() from public, anon, authenticated;

-- Profile status is an indicator, never a way to unlock a finished test.
create or replace function public.guard_personality_profile_status()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.assessment_status = 'completed' and new.assessment_status <> 'completed' then
    raise exception 'Completed personality status cannot be reset';
  end if;
  if new.assessment_status = 'completed'
    and old.assessment_status is distinct from 'completed'
    and not exists (
      select 1 from public.personality_assessments a
      where a.user_id = new.user_id and a.status = 'completed'
    ) then
    raise exception 'A completed personality assessment is required';
  end if;
  return new;
end;
$$;
drop trigger if exists personality_profile_status_guard on public.profiles;
create trigger personality_profile_status_guard
before update of assessment_status on public.profiles
for each row execute function public.guard_personality_profile_status();
revoke execute on function public.guard_personality_profile_status() from public, anon, authenticated;
