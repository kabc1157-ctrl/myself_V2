create or replace function public.convert_brain_dump_to_todo(p_dump_id uuid, p_planned_date date)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_content text;
  v_converted uuid;
  v_todo_id uuid;
begin
  select content, converted_todo_id into v_content, v_converted
  from public.brain_dumps
  where id = p_dump_id and user_id = (select auth.uid())
  for update;
  if not found then raise exception 'brain dump not found'; end if;
  if v_converted is not null then raise exception 'already converted'; end if;
  insert into public.todos(user_id,title,memo,planned_date)
  values ((select auth.uid()),left(v_content,200),case when char_length(v_content)>200 then v_content else '' end,p_planned_date)
  returning id into v_todo_id;
  update public.brain_dumps set converted_todo_id=v_todo_id,converted_at=now(),updated_at=now()
  where id=p_dump_id and user_id=(select auth.uid());
  return v_todo_id;
end;
$$;
revoke all on function public.convert_brain_dump_to_todo(uuid,date) from public, anon;
grant execute on function public.convert_brain_dump_to_todo(uuid,date) to authenticated;
