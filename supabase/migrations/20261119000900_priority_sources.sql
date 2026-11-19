alter table public.priority_slots add column if not exists source_type text not null default 'todo';
alter table public.priority_slots add column if not exists source_id text;
alter table public.priority_slots alter column todo_id drop not null;
alter table public.priority_slots drop constraint if exists priority_slots_source_check;
alter table public.priority_slots add constraint priority_slots_source_check check (source_type in ('todo','google','brain_dump'));
create unique index if not exists priority_slots_source_unique on public.priority_slots(user_id,priority_date,source_type,source_id) where source_id is not null;
alter table public.priority_slots drop constraint if exists priority_slots_source_required;
alter table public.priority_slots add constraint priority_slots_source_required check ((source_type='todo' and todo_id is not null) or (source_type<>'todo' and source_id is not null));
-- 기존 todo 전용 행은 source_type=todo와 todo_id를 그대로 보존한다.
