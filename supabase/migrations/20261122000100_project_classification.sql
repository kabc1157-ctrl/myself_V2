alter table public.projects
  add column if not exists classification text not null default 'career';

alter table public.projects
  drop constraint if exists projects_classification_check;

alter table public.projects
  add constraint projects_classification_check
  check (classification in ('asset', 'relationship', 'career', 'health'));
