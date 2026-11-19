alter table public.brain_dumps drop constraint if exists brain_dumps_converted_todo_id_user_id_fkey;
alter table public.brain_dumps
  add constraint brain_dumps_converted_todo_id_user_id_fkey
  foreign key (converted_todo_id, user_id)
  references public.todos(id, user_id)
  on delete set null (converted_todo_id);
