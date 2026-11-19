create table if not exists public.google_calendar_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz not null,
  account_email text,
  calendar_id text not null default 'primary',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint google_calendar_connections_calendar_id_not_blank check (btrim(calendar_id) <> '')
);

alter table public.google_calendar_connections enable row level security;

create policy "google_calendar_connections_select_own"
  on public.google_calendar_connections for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "google_calendar_connections_insert_own"
  on public.google_calendar_connections for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "google_calendar_connections_update_own"
  on public.google_calendar_connections for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "google_calendar_connections_delete_own"
  on public.google_calendar_connections for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.google_calendar_connections from anon, authenticated;
