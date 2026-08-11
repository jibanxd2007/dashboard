-- Solo-Founder CRM Schema for Supabase Postgres
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Contacts Table (Leads and Clients)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text,
  email text,
  phone text not null,
  type text check (type in ('lead', 'client')) default 'lead' not null,
  stage text check (stage in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'active', 'churned')) default 'new' not null,
  source text check (source in ('instagram', 'facebook', 'whatsapp', 'linkedin', 'website', 'referral', 'manual', 'other')) default 'manual' not null,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  deal_value numeric default 0 not null,
  tags text[] default '{}'::text[] not null,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Tasks Table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  remind_at timestamptz,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium' not null,
  status text check (status in ('open', 'done')) default 'open' not null,
  completed_at timestamptz,
  reminded_at timestamptz,
  created_at timestamptz default now() not null
);

-- 3. Meetings Table
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text check (mode in ('call', 'video', 'in_person')) default 'video' not null,
  location_or_link text,
  agenda text,
  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled' not null,
  remind_minutes_before int default 30 not null,
  reminded_at timestamptz,
  created_at timestamptz default now() not null
);

-- 4. Activities Timeline Table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade not null,
  type text check (type in ('note', 'call', 'whatsapp', 'email', 'meeting', 'stage_change', 'created')) not null,
  body text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

-- 5. Notification Log Table (for Cron Idempotency)
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  kind text check (kind in ('task_due', 'meeting_soon', 'new_lead', 'daily_digest', 'stale_lead')) not null,
  ref_id text,
  dedupe_key text unique not null,
  status text default 'sent' not null,
  error text,
  sent_at timestamptz default now() not null
);

-- 6. Settings Table (Single Row)
create table if not exists public.settings (
  id int primary key check (id = 1) default 1,
  whatsapp_number text default '',
  callmebot_key text default '',
  digest_hour int default 8 not null,
  digest_minute int default 30 not null,
  quiet_start int default 22 not null,
  quiet_end int default 8 not null,
  stale_lead_days int default 7 not null,
  notify_new_lead boolean default true not null,
  notify_task_due boolean default true not null,
  notify_meeting boolean default true not null,
  notify_digest boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 7. Capture Links Table
create table if not exists public.capture_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  source text default 'instagram' not null,
  campaign text,
  created_at timestamptz default now() not null
);

-- 8. Team Members Table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  role text check (role in ('owner', 'manager', 'member')) default 'member' not null,
  title text,
  status text check (status in ('active', 'inactive')) default 'active' not null,
  joined_at timestamptz,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 9. Team Meetings Table (internal meetings; client meetings live in `meetings`)
create table if not exists public.team_meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text check (mode in ('call', 'video', 'in_person')) default 'video' not null,
  location_or_link text,
  agenda text,
  status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled' not null,
  attendee_ids uuid[] default '{}'::uuid[] not null,
  remind_minutes_before int default 30 not null,
  reminded_at timestamptz,
  created_at timestamptz default now() not null
);

-- Indexes for Speed
create index if not exists idx_contacts_stage on public.contacts(stage);
create index if not exists idx_contacts_type on public.contacts(type);
create index if not exists idx_contacts_phone on public.contacts(phone);
create index if not exists idx_tasks_due_at on public.tasks(due_at);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_meetings_starts_at on public.meetings(starts_at);
create index if not exists idx_activities_contact_id on public.activities(contact_id);
create index if not exists idx_team_members_status on public.team_members(status);
create index if not exists idx_team_meetings_starts_at on public.team_meetings(starts_at);

-- Updated At Trigger Function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.update_updated_at_column();

-- Enable Row Level Security (RLS) with NO public policies (service role key bypasses RLS)
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.meetings enable row level security;
alter table public.activities enable row level security;
alter table public.notification_log enable row level security;
alter table public.settings enable row level security;
alter table public.capture_links enable row level security;
alter table public.team_members enable row level security;
alter table public.team_meetings enable row level security;

-- Insert default settings row if missing
insert into public.settings (id, whatsapp_number, callmebot_key)
values (1, '', '')
on conflict (id) do nothing;

-- No contacts, tasks, meetings, activities or capture links are seeded.
-- This schema creates an empty CRM; every record comes from real use.
-- Create your capture links from the Capture Links page in the app.
