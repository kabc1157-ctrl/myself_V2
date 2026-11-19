alter table public.projects add column if not exists result text not null default '';
alter table public.projects add column if not exists memo text not null default '';
create table if not exists public.project_kpis (
  id uuid primary key default gen_random_uuid(), project_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, target_value numeric(24,8), actual_value numeric(24,8), unit text not null default '', sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  constraint project_kpis_owner foreign key(project_id,user_id) references public.projects(id,user_id) on delete cascade
);
create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(), project_id uuid not null, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id),
  unique(project_id,user_id,name), constraint project_categories_owner foreign key(project_id,user_id) references public.projects(id,user_id) on delete cascade
);
alter table public.todos add column if not exists project_category_id uuid;
alter table public.todos drop constraint if exists todos_project_category_owner;
alter table public.todos add constraint todos_project_category_owner foreign key(project_category_id,user_id) references public.project_categories(id,user_id) on delete set null;
create index if not exists project_kpis_project_idx on public.project_kpis(user_id,project_id,sort_order);
create index if not exists project_categories_project_idx on public.project_categories(user_id,project_id,sort_order);
alter table public.project_kpis enable row level security; alter table public.project_categories enable row level security;
drop policy if exists project_kpis_select_own on public.project_kpis; drop policy if exists project_kpis_insert_own on public.project_kpis; drop policy if exists project_kpis_update_own on public.project_kpis; drop policy if exists project_kpis_delete_own on public.project_kpis;
drop policy if exists project_categories_select_own on public.project_categories; drop policy if exists project_categories_insert_own on public.project_categories; drop policy if exists project_categories_update_own on public.project_categories; drop policy if exists project_categories_delete_own on public.project_categories;
create policy project_kpis_select_own on public.project_kpis for select to authenticated using ((select auth.uid())=user_id); create policy project_kpis_insert_own on public.project_kpis for insert to authenticated with check ((select auth.uid())=user_id); create policy project_kpis_update_own on public.project_kpis for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id); create policy project_kpis_delete_own on public.project_kpis for delete to authenticated using ((select auth.uid())=user_id);
create policy project_categories_select_own on public.project_categories for select to authenticated using ((select auth.uid())=user_id); create policy project_categories_insert_own on public.project_categories for insert to authenticated with check ((select auth.uid())=user_id); create policy project_categories_update_own on public.project_categories for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id); create policy project_categories_delete_own on public.project_categories for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.project_kpis,public.project_categories to authenticated; revoke all on public.project_kpis,public.project_categories from anon;
