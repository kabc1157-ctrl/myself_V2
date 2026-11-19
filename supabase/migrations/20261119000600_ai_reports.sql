create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('weekly','monthly')), period_start date not null, period_end date not null,
  title text not null default '', content text not null default '', source_record_ids jsonb not null default '[]'::jsonb,
  consent_snapshot jsonb not null default '{}'::jsonb, is_read boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id), unique (user_id,report_type,period_start)
);
create table if not exists public.ai_report_annotations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, report_id uuid not null,
  start_offset integer not null check (start_offset >= 0), end_offset integer not null check (end_offset > start_offset), color text not null default 'yellow', selected_text text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id), constraint ai_annotation_owner foreign key (report_id,user_id) references public.ai_reports(id,user_id) on delete cascade
);
create table if not exists public.ai_report_notes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, report_id uuid not null, content text not null check (char_length(btrim(content)) between 1 and 10000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,user_id), constraint ai_note_owner foreign key (report_id,user_id) references public.ai_reports(id,user_id) on delete cascade
);
alter table public.brain_dumps add column if not exists source_report_id uuid;
alter table public.brain_dumps drop constraint if exists brain_dumps_source_report_owner;
alter table public.brain_dumps add constraint brain_dumps_source_report_owner foreign key (source_report_id,user_id) references public.ai_reports(id,user_id) on delete set null;
do $$ declare t text; begin foreach t in array array['ai_reports','ai_report_annotations','ai_report_notes'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy ai_reports_select_own on public.ai_reports for select to authenticated using ((select auth.uid())=user_id); create policy ai_reports_update_own on public.ai_reports for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy ai_report_annotations_select_own on public.ai_report_annotations for select to authenticated using ((select auth.uid())=user_id); create policy ai_report_annotations_insert_own on public.ai_report_annotations for insert to authenticated with check ((select auth.uid())=user_id); create policy ai_report_annotations_update_own on public.ai_report_annotations for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id); create policy ai_report_annotations_delete_own on public.ai_report_annotations for delete to authenticated using ((select auth.uid())=user_id);
create policy ai_report_notes_select_own on public.ai_report_notes for select to authenticated using ((select auth.uid())=user_id); create policy ai_report_notes_insert_own on public.ai_report_notes for insert to authenticated with check ((select auth.uid())=user_id); create policy ai_report_notes_update_own on public.ai_report_notes for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id); create policy ai_report_notes_delete_own on public.ai_report_notes for delete to authenticated using ((select auth.uid())=user_id);
grant select,update on public.ai_reports to authenticated; grant select,insert,update,delete on public.ai_report_annotations,public.ai_report_notes to authenticated; revoke all on public.ai_reports,public.ai_report_annotations,public.ai_report_notes from anon;
