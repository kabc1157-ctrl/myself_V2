-- IEUMSAE P4: completed assessment + profile transition must commit atomically.
-- A trusted server action computes the scores/report and performs one UPDATE
-- using the server-only secret key. The trigger updates the same user's profile
-- in that UPDATE transaction. A failed profile transition rolls back completion.

create or replace function public.mark_personality_profile_completed()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'completed' and old.status = 'in_progress' then
    update public.profiles
       set assessment_status = 'completed',
           onboarding_step = case
             when onboarding_step = 'assessment' then 'modules'
             else onboarding_step
           end,
           updated_at = now()
     where user_id = new.user_id;

    if not found then
      raise exception 'Profile not found for completed assessment';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists personality_assessment_profile_complete on public.personality_assessments;
create trigger personality_assessment_profile_complete
after update of status on public.personality_assessments
for each row
when (old.status = 'in_progress' and new.status = 'completed')
execute function public.mark_personality_profile_completed();

revoke execute on function public.mark_personality_profile_completed() from public, anon, authenticated;

-- Preserve account deletion semantics: the immutable completed result remains
-- protected while its owner exists, but may be removed through auth.users cascade.
create or replace function public.guard_personality_assessment_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'DELETE' then
    if old.status in ('completed', 'locked')
       and exists(select 1 from auth.users where id = old.user_id) then
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

revoke execute on function public.guard_personality_assessment_mutation() from public, anon, authenticated;
