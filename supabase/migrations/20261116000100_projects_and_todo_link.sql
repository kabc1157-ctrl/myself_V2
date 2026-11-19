create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null default '',
  start_date date,
  target_date date,
  category text not null default '',
  status text not null default 'planned' check (status in ('planned','in_progress','on_hold','completed')),
  status_source text not null default 'manual' check (status_source in ('manual','automatic')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (target_date is null or start_date is null or target_date >= start_date)
);

create index if not exists projects_user_start_date_idx on public.projects(user_id, start_date);
create index if not exists projects_user_status_idx on public.projects(user_id, status, updated_at desc);

alter table public.todos drop constraint if exists todos_project_id_fkey;
alter table public.todos
  add constraint todos_project_owner_fkey foreign key (project_id, user_id)
  references public.projects(id, user_id) on delete set null (project_id);

create table if not exists public.project_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  content text not null check (char_length(btrim(content)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint project_reflections_project_owner_fkey foreign key (project_id, user_id)
    references public.projects(id, user_id) on delete cascade
);

create index if not exists project_reflections_project_idx on public.project_reflections(user_id, project_id, updated_at desc);

alter table public.projects enable row level security;
alter table public.project_reflections enable row level security;

drop policy if exists projects_select_own on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;
create policy projects_select_own on public.projects for select to authenticated using ((select auth.uid()) = user_id);
create policy projects_insert_own on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
create policy projects_update_own on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy projects_delete_own on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists project_reflections_select_own on public.project_reflections;
drop policy if exists project_reflections_insert_own on public.project_reflections;
drop policy if exists project_reflections_update_own on public.project_reflections;
drop policy if exists project_reflections_delete_own on public.project_reflections;
create policy project_reflections_select_own on public.project_reflections for select to authenticated using ((select auth.uid()) = user_id);
create policy project_reflections_insert_own on public.project_reflections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy project_reflections_update_own on public.project_reflections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy project_reflections_delete_own on public.project_reflections for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.projects, public.project_reflections to authenticated;
revoke all on public.projects, public.project_reflections from anon;

create or replace function public.recalculate_one_project(project_uuid uuid)
returns void language plpgsql security invoker set search_path = public
as $$
declare total_count integer; done_count integer;
begin
  if project_uuid is null then return; end if;
  select count(*)::integer, count(*) filter (where is_completed)::integer
    into total_count, done_count from public.todos
   where project_id = project_uuid and user_id = (select auth.uid());
  if total_count > 0 and done_count = total_count then
    update public.projects set status='completed', status_source='automatic', completed_at=coalesce(completed_at, now()), updated_at=now()
     where id=project_uuid and user_id=(select auth.uid());
  elsif total_count > 0 then
    update public.projects set status='in_progress', status_source='automatic', completed_at=null, updated_at=now()
     where id=project_uuid and user_id=(select auth.uid()) and status='completed';
  end if;
end;
$$;

create or replace function public.recalculate_project_status()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_one_project(old.project_id); return old;
  end if;
  if old.project_id is distinct from new.project_id then perform public.recalculate_one_project(old.project_id); end if;
  perform public.recalculate_one_project(new.project_id);
  return new;
end;
$$;

drop trigger if exists todos_recalculate_project_status on public.todos;
create trigger todos_recalculate_project_status after insert or update of project_id, is_completed or delete on public.todos
for each row execute function public.recalculate_project_status();

revoke all on function public.recalculate_one_project(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_project_status() from public, anon, authenticated;
