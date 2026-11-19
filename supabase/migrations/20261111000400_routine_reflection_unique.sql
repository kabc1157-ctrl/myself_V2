alter table public.routine_reflections
  add constraint routine_reflections_routine_date_key unique (routine_id, reflection_date);
