create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  content text not null default '',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id)
);
create index if not exists memos_user_updated_idx on public.memos(user_id, updated_at desc) where deleted_at is null;
create index if not exists memos_user_pinned_idx on public.memos(user_id, is_pinned, updated_at desc) where deleted_at is null;

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, user_id)
);
create index if not exists checklists_user_updated_idx on public.checklists(user_id, updated_at desc) where deleted_at is null;
create index if not exists checklists_user_pinned_idx on public.checklists(user_id, is_pinned, updated_at desc) where deleted_at is null;

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_id uuid not null,
  content text not null check (char_length(btrim(content)) between 1 and 500),
  is_completed boolean not null default false,
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint checklist_items_owner_fkey foreign key (checklist_id, user_id) references public.checklists(id, user_id) on delete cascade
);
create index if not exists checklist_items_list_order_idx on public.checklist_items(user_id, checklist_id, order_index, created_at);

alter table public.memos enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
drop policy if exists memos_select_own on public.memos;
drop policy if exists memos_insert_own on public.memos;
drop policy if exists memos_update_own on public.memos;
drop policy if exists memos_delete_own on public.memos;
create policy memos_select_own on public.memos for select to authenticated using ((select auth.uid()) = user_id);
create policy memos_insert_own on public.memos for insert to authenticated with check ((select auth.uid()) = user_id);
create policy memos_update_own on public.memos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy memos_delete_own on public.memos for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists checklists_select_own on public.checklists;
drop policy if exists checklists_insert_own on public.checklists;
drop policy if exists checklists_update_own on public.checklists;
drop policy if exists checklists_delete_own on public.checklists;
create policy checklists_select_own on public.checklists for select to authenticated using ((select auth.uid()) = user_id);
create policy checklists_insert_own on public.checklists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy checklists_update_own on public.checklists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy checklists_delete_own on public.checklists for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists checklist_items_select_own on public.checklist_items;
drop policy if exists checklist_items_insert_own on public.checklist_items;
drop policy if exists checklist_items_update_own on public.checklist_items;
drop policy if exists checklist_items_delete_own on public.checklist_items;
create policy checklist_items_select_own on public.checklist_items for select to authenticated using ((select auth.uid()) = user_id);
create policy checklist_items_insert_own on public.checklist_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy checklist_items_update_own on public.checklist_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy checklist_items_delete_own on public.checklist_items for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.memos, public.checklists, public.checklist_items to authenticated;
revoke all on public.memos, public.checklists, public.checklist_items from anon;

create or replace function public.enforce_pinned_record_limit()
returns trigger language plpgsql security invoker set search_path = public
as $$
declare max_pinned integer; current_pinned integer;
begin
  if new.is_pinned is not true or new.deleted_at is not null then return new; end if;
  max_pinned := case when tg_table_name = 'memos' then 3 else 2 end;
  select count(*)::integer into current_pinned from public.memos where tg_table_name = 'memos' and user_id = new.user_id and is_pinned and deleted_at is null and (tg_op = 'INSERT' or id <> new.id);
  if tg_table_name = 'checklists' then select count(*)::integer into current_pinned from public.checklists where user_id = new.user_id and is_pinned and deleted_at is null and (tg_op = 'INSERT' or id <> new.id); end if;
  if current_pinned >= max_pinned then raise exception 'pinned_limit_exceeded'; end if;
  return new;
end;
$$;
drop trigger if exists memos_pinned_limit on public.memos;
create trigger memos_pinned_limit before insert or update of is_pinned, deleted_at on public.memos for each row execute function public.enforce_pinned_record_limit();
drop trigger if exists checklists_pinned_limit on public.checklists;
create trigger checklists_pinned_limit before insert or update of is_pinned, deleted_at on public.checklists for each row execute function public.enforce_pinned_record_limit();
revoke all on function public.enforce_pinned_record_limit() from public, anon, authenticated;
