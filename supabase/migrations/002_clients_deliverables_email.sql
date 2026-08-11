-- ============================================================
-- MIGRATION 002 — Client workspace, deliverables, email layer
-- Paste this on top of an existing database. Additive only:
-- nothing is dropped and no table is recreated. Safe to re-run.
-- ============================================================

-- Deliverables: the work owed to a client.
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.contacts(id) on delete cascade not null,
  title text not null,
  description text,
  type text check (type in ('design','development','content','campaign','report','other')) default 'other' not null,
  status text check (status in ('not_started','in_progress','in_review','blocked','delivered','approved')) default 'not_started' not null,
  priority text check (priority in ('low','medium','high')) default 'medium' not null,
  due_at timestamptz,
  owner_id uuid references public.team_members(id) on delete set null,
  value numeric,
  remind_offsets int[] default '{72,24,0}'::int[] not null,
  blocked_reason text,
  blocked_since timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Checklist inside a deliverable.
create table if not exists public.deliverable_items (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references public.deliverables(id) on delete cascade not null,
  label text not null,
  done boolean default false not null,
  position int default 0 not null,
  created_at timestamptz default now() not null
);

-- Labelled URLs per client (Figma, Drive, staging, repo). No file storage.
create table if not exists public.client_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.contacts(id) on delete cascade not null,
  label text not null,
  url text not null,
  created_at timestamptz default now() not null
);

-- Email audit + dedupe. Mirrors notification_log.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  template text not null,
  subject text not null,
  ref_id text,
  dedupe_key text unique not null,
  status text default 'sent' not null,
  provider_id text,
  error text,
  sent_at timestamptz default now() not null
);

-- Task ownership and deliverable linkage.
alter table public.tasks add column if not exists assignee_id uuid references public.team_members(id) on delete set null;
alter table public.tasks add column if not exists deliverable_id uuid references public.deliverables(id) on delete set null;

-- Meetings gain an explicit link, invite tracking and attendee reminder policy.
alter table public.meetings add column if not exists meeting_link text;
alter table public.meetings add column if not exists additional_recipients text[] default '{}'::text[];
alter table public.meetings add column if not exists invite_sent_at timestamptz;
alter table public.meetings add column if not exists invite_sequence int default 0 not null;
alter table public.meetings add column if not exists attendee_reminder text default 'both';

-- Per-client read-only status link (Phase 17).
alter table public.contacts add column if not exists status_token text unique;
alter table public.contacts add column if not exists status_link_enabled boolean default false not null;

-- Reminder trigger toggles, stored as JSON so new triggers need no migration.
alter table public.settings add column if not exists reminder_matrix jsonb default '{}'::jsonb;
alter table public.settings add column if not exists team_digest_hour int default 9;

create index if not exists idx_deliverables_client on public.deliverables(client_id);
create index if not exists idx_deliverables_status on public.deliverables(status);
create index if not exists idx_deliverables_due_at on public.deliverables(due_at);
create index if not exists idx_deliverable_items_parent on public.deliverable_items(deliverable_id);
create index if not exists idx_client_links_client on public.client_links(client_id);
create index if not exists idx_email_log_ref on public.email_log(ref_id);
create index if not exists idx_email_log_dedupe on public.email_log(dedupe_key);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);

drop trigger if exists set_deliverables_updated_at on public.deliverables;
create trigger set_deliverables_updated_at
  before update on public.deliverables
  for each row execute function public.update_updated_at_column();

-- RLS on, no policies: the server-side secret key bypasses it, nothing else
-- can reach these tables. Consistent with every other table in this schema.
alter table public.deliverables enable row level security;
alter table public.deliverable_items enable row level security;
alter table public.client_links enable row level security;
alter table public.email_log enable row level security;
