alter table public.routine_reflections
  alter column routine_id drop not null;

alter table public.routine_reflections
  drop constraint if exists routine_reflections_routine_date_key;

alter table public.routine_reflections
  add constraint routine_reflections_user_date_key unique (user_id, reflection_date);
