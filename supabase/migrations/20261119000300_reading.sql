create table if not exists public.reading_books (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200), author text not null default '', keywords text not null default '',
  total_pages integer not null check (total_pages >= 1), deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null, reading_date date not null, pages_read integer not null check (pages_read >= 0), title text not null default '', content text not null default '', memo text not null default '',
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, user_id), constraint reading_logs_book_owner foreign key (book_id, user_id) references public.reading_books(id, user_id) on delete cascade
);
create index if not exists reading_books_user_updated on public.reading_books(user_id, updated_at desc) where deleted_at is null;
create index if not exists reading_logs_user_date on public.reading_logs(user_id, reading_date desc, created_at desc) where deleted_at is null;
alter table public.reading_books enable row level security; alter table public.reading_logs enable row level security;
drop policy if exists reading_books_select_own on public.reading_books; create policy reading_books_select_own on public.reading_books for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists reading_books_insert_own on public.reading_books; create policy reading_books_insert_own on public.reading_books for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists reading_books_update_own on public.reading_books; create policy reading_books_update_own on public.reading_books for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists reading_books_delete_own on public.reading_books; create policy reading_books_delete_own on public.reading_books for delete to authenticated using ((select auth.uid())=user_id);
drop policy if exists reading_logs_select_own on public.reading_logs; create policy reading_logs_select_own on public.reading_logs for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists reading_logs_insert_own on public.reading_logs; create policy reading_logs_insert_own on public.reading_logs for insert to authenticated with check ((select auth.uid())=user_id and exists (select 1 from public.reading_books b where b.id=book_id and b.user_id=(select auth.uid()) and b.deleted_at is null));
drop policy if exists reading_logs_update_own on public.reading_logs; create policy reading_logs_update_own on public.reading_logs for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists reading_logs_delete_own on public.reading_logs; create policy reading_logs_delete_own on public.reading_logs for delete to authenticated using ((select auth.uid())=user_id);
grant select, insert, update, delete on public.reading_books, public.reading_logs to authenticated; revoke all on public.reading_books, public.reading_logs from anon;
