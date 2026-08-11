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

-- Indexes for Speed
create index if not exists idx_contacts_stage on public.contacts(stage);
create index if not exists idx_contacts_type on public.contacts(type);
create index if not exists idx_contacts_phone on public.contacts(phone);
create index if not exists idx_tasks_due_at on public.tasks(due_at);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_meetings_starts_at on public.meetings(starts_at);
create index if not exists idx_activities_contact_id on public.activities(contact_id);

-- Updated At Trigger Function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at_column();

create trigger set_settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at_column();

-- Enable Row Level Security (RLS) with NO public policies (service role key bypasses RLS)
alter table public.contacts enable row level security;
alter table public.tasks enable row level security;
alter table public.meetings enable row level security;
alter table public.activities enable row level security;
alter table public.notification_log enable row level security;
alter table public.settings enable row level security;
alter table public.capture_links enable row level security;

-- Insert default settings row if missing
insert into public.settings (id, whatsapp_number, callmebot_key)
values (1, '', '')
on conflict (id) do nothing;

-- Insert default capture link
insert into public.capture_links (slug, label, source, campaign)
values ('instagram-bio', 'Instagram Bio Link', 'instagram', 'bio_link')
on conflict (slug) do nothing;

-- Seed Data (12 Realistic Indian Contacts, Tasks, Meetings)
insert into public.contacts (id, full_name, company, email, phone, type, stage, source, deal_value, tags, notes, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Rahul Verma', 'Verma Tech Solutions', 'rahul@vermatech.in', '+919876543210', 'lead', 'new', 'instagram', 150000, array['Shopify', 'High Value'], 'Looking for complete e-commerce website redesign.', now() - interval '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'Priya Sharma', 'Sharma Studio', 'priya@sharmastudio.co', '+919812345678', 'lead', 'contacted', 'whatsapp', 85000, array['Branding', 'Social Media'], 'Sent initial portfolio brochure over WhatsApp.', now() - interval '1 day'),
  ('33333333-3333-3333-3333-333333333333', 'Sneha Patel', 'Patel Organics', 'sneha@patelorganics.com', '+919988776655', 'lead', 'qualified', 'website', 240000, array['SEO', 'Web Dev'], 'Qualified lead. Budget approved for 6-month growth retainer.', now() - interval '3 days'),
  ('44444444-4444-4444-4444-444444444444', 'Vikramaditya Rao', 'Rao Logistics', 'vikram@raologistics.in', '+919711223344', 'lead', 'proposal', 'linkedin', 350000, array['Custom Web App', 'Urgent'], 'Proposal sent. Awaiting feedback on timeline.', now() - interval '5 days'),
  ('55555555-5555-5555-5555-555555555555', 'Aarav Gupta', 'Sneakinn India', 'aarav@sneakinn.in', '+919899001122', 'client', 'won', 'referral', 500000, array['Retainer', 'Design Systems'], 'Active client. Ongoing UI/UX design contract.', now() - interval '14 days'),
  ('66666666-6666-6666-6666-666666666666', 'Ananya Deshmukh', 'Deshmukh Apparel', 'ananya@deshmukhapparel.in', '+919844332211', 'client', 'active', 'instagram', 180000, array['Performance Marketing'], 'Monthly ad spend management client.', now() - interval '20 days'),
  ('77777777-7777-7777-7777-777777777777', 'Rohan Mehta', 'Sohlene Living', 'rohan@sohlene.com', '+919755443322', 'lead', 'new', 'facebook', 120000, array['Lead Gen'], 'Inquired about Facebook ads campaign setup.', now() - interval '4 hours'),
  ('88888888-8888-8888-8888-888888888888', 'Kavya Iyer', 'Iyer Law Practice', 'kavya@iyerlaw.in', '+919633221100', 'lead', 'contacted', 'manual', 95000, array['Corporate Web'], 'Met at networking event in Bengaluru.', now() - interval '2 days'),
  ('99999999-9999-9999-9999-999999999999', 'Devendra Singh', 'Singh Auto Corp', 'dev@singhauto.in', '+919522110099', 'lead', 'lost', 'other', 75000, array['Low Budget'], 'Decided to build in-house.', now() - interval '10 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ishaan Malhotra', 'Malhotra Health', 'ishaan@malhotrahealth.com', '+919411009988', 'client', 'active', 'referral', 320000, array['Mobile App', 'Flutter'], 'Retainer for iOS app maintenance.', now() - interval '30 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Meera Joshi', 'Joshi Crafts', 'meera@joshicrafts.com', '+919300998877', 'lead', 'proposal', 'website', 110000, array['Shopify'], 'Proposal review scheduled for tomorrow.', now() - interval '4 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tanvi Kapoor', 'Kapoor Digital', 'tanvi@kapoordigital.in', '+919299887766', 'client', 'churned', 'linkedin', 160000, array['SEO'], 'Completed 3-month contract.', now() - interval '60 days')
on conflict (id) do nothing;

-- Seed Tasks
insert into public.tasks (contact_id, title, description, due_at, priority, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Send initial proposal to Rahul', 'Draft scope of work for Shopify store revamp.', now() + interval '2 hours', 'high', 'open'),
  ('22222222-2222-2222-2222-222222222222', 'Follow up with Priya Sharma on WhatsApp', 'Check if she reviewed the PDF brochure.', now() - interval '1 day', 'medium', 'open'),
  ('44444444-4444-4444-4444-444444444444', 'Review custom quote with Vikramaditya', 'Schedule clarification call for dev timeline.', now() + interval '1 day', 'high', 'open'),
  ('55555555-5555-5555-5555-555555555555', 'Send Sneakinn monthly performance report', 'Compile Google Analytics & Shopify sales stats.', now() + interval '3 days', 'medium', 'open')
on conflict do nothing;

-- Seed Meetings
insert into public.meetings (contact_id, title, starts_at, ends_at, mode, location_or_link, agenda, status)
values
  ('33333333-3333-3333-3333-333333333333', 'Discovery Call with Sneha Patel', now() + interval '3 hours', now() + interval '3 hours 30 minutes', 'video', 'https://meet.google.com/abc-defg-hij', 'Discuss SEO scope and organic strategy', 'scheduled'),
  ('77777777-7777-7777-7777-777777777777', 'Introductory Call with Rohan Mehta', now() + interval '1 day 2 hours', now() + interval '1 day 2 hours 30 minutes', 'call', '+91 97554 43322', 'Understand Facebook Ad campaign targets', 'scheduled')
on conflict do nothing;

-- Seed Activities
insert into public.activities (contact_id, type, body)
values
  ('11111111-1111-1111-1111-111111111111', 'created', 'Inbound lead received via Instagram Bio Link.'),
  ('22222222-2222-2222-2222-222222222222', 'whatsapp', 'Sent initial introductory message & agency credentials portfolio.'),
  ('44444444-4444-4444-4444-444444444444', 'stage_change', 'Moved stage from Qualified to Proposal.'),
  ('55555555-5555-5555-5555-555555555555', 'stage_change', 'Moved stage from Proposal to Won.')
on conflict do nothing;
