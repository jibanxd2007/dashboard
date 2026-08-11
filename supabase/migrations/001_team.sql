-- Team members and team meetings.
-- Run this in the Supabase SQL Editor if you already created the base schema.
-- Safe to run more than once.

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

create index if not exists idx_team_members_status on public.team_members(status);
create index if not exists idx_team_meetings_starts_at on public.team_meetings(starts_at);

-- Keep updated_at current on team_members.
drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
  before update on public.team_members
  for each row execute function public.update_updated_at_column();

-- RLS on with no policies: the server-side secret key bypasses RLS, and
-- nothing else can reach these tables. Matches the other tables in this schema.
alter table public.team_members enable row level security;
alter table public.team_meetings enable row level security;
