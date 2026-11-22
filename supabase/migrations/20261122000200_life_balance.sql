-- Life balance: additive fields. Only completed activities count.
alter table public.todos
  add column if not exists life_area text;
alter table public.todos
  drop constraint if exists todos_life_area_check;
alter table public.todos
  add constraint todos_life_area_check
  check (life_area is null or life_area in ('asset', 'relationship', 'career', 'health'));

alter table public.routine_definitions
  add column if not exists life_area text not null default 'health';
alter table public.routine_definitions
  drop constraint if exists routine_definitions_life_area_check;
alter table public.routine_definitions
  add constraint routine_definitions_life_area_check
  check (life_area in ('asset', 'relationship', 'career', 'health'));

create table if not exists public.calendar_event_life_areas (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  event_date date not null,
  life_area text not null check (life_area in ('asset', 'relationship', 'career', 'health')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id, event_date),
  constraint calendar_event_life_areas_event_id_length check (length(event_id) between 1 and 512)
);

create index if not exists calendar_event_life_areas_user_date_idx
  on public.calendar_event_life_areas(user_id, event_date);
alter table public.calendar_event_life_areas enable row level security;

drop policy if exists "life area calendar select own" on public.calendar_event_life_areas;
create policy "life area calendar select own"
on public.calendar_event_life_areas for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "life area calendar insert own" on public.calendar_event_life_areas;
create policy "life area calendar insert own"
on public.calendar_event_life_areas for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "life area calendar update own" on public.calendar_event_life_areas;
create policy "life area calendar update own"
on public.calendar_event_life_areas for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "life area calendar delete own" on public.calendar_event_life_areas;
create policy "life area calendar delete own"
on public.calendar_event_life_areas for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.calendar_event_life_areas to authenticated;