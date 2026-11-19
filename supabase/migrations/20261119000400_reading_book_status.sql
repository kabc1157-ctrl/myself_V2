alter table public.reading_books
  add column if not exists status text not null default 'reading',
  add column if not exists status_changed_at timestamptz;

alter table public.reading_books
  drop constraint if exists reading_books_status_check;
alter table public.reading_books
  add constraint reading_books_status_check check (status in ('reading', 'on_hold', 'completed'));
create index if not exists reading_books_user_status_idx on public.reading_books(user_id, status, status_changed_at desc) where deleted_at is null;
