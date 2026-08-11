import { ContactStage, ContactType, ContactSource, TaskPriority, TaskStatus, MeetingMode, MeetingStatus, ActivityType } from "@/lib/database.types";

export interface ContactItem {
  id: string;
  full_name: string;
  company: string | null;
  email: string | null;
  phone: string;
  type: ContactType;
  stage: ContactStage;
  source: ContactSource;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  deal_value: number;
  tags: string[];
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  remind_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  reminded_at: string | null;
  created_at: string;
}

export interface MeetingItem {
  id: string;
  contact_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  mode: MeetingMode;
  location_or_link: string | null;
  agenda: string | null;
  status: MeetingStatus;
  remind_minutes_before: number;
  reminded_at: string | null;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  contact_id: string;
  type: ActivityType;
  body: string;
  meta: Record<string, any>;
  created_at: string;
}

export interface SettingsItem {
  id: number;
  whatsapp_number: string;
  callmebot_key: string;
  digest_hour: number;
  digest_minute: number;
  quiet_start: number;
  quiet_end: number;
  stale_lead_days: number;
  notify_new_lead: boolean;
  notify_task_due: boolean;
  notify_meeting: boolean;
  notify_digest: boolean;
  redact_pii: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIThread {
  id: string;
  title: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system" | "data";
  content: any;
  created_at: string;
}

export interface AIUsageItem {
  id: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
}

export interface CaptureLinkItem {
  id: string;
  slug: string;
  label: string;
  source: ContactSource;
  campaign: string | null;
  created_at: string;
}

export interface AgentActionItem {
  id: string;
  tool: string;
  payload: Record<string, any>;
  inverse: Record<string, any>;
  undone_at: string | null;
  created_at: string;
}

const now = new Date();

export const INITIAL_CONTACTS: ContactItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "Rahul Verma",
    company: "Verma Tech Solutions",
    email: "rahul@vermatech.in",
    phone: "+919876543210",
    type: "lead",
    stage: "new",
    source: "instagram",
    campaign: "bio_link",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "bio_link",
    deal_value: 150000,
    tags: ["Shopify", "High Value"],
    notes: "Looking for complete e-commerce website redesign and mobile optimization.",
    last_contacted_at: null,
    created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "Priya Sharma",
    company: "Sharma Studio",
    email: "priya@sharmastudio.co",
    phone: "+919812345678",
    type: "lead",
    stage: "contacted",
    source: "whatsapp",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 85000,
    tags: ["Branding", "Social Media"],
    notes: "Sent initial portfolio brochure over WhatsApp. Follow up scheduled.",
    last_contacted_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    full_name: "Sneha Patel",
    company: "Patel Organics",
    email: "sneha@patelorganics.com",
    phone: "+919988776655",
    type: "lead",
    stage: "qualified",
    source: "website",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 240000,
    tags: ["SEO", "Web Dev"],
    notes: "Qualified lead. Budget approved for 6-month organic growth retainer.",
    last_contacted_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    full_name: "Vikramaditya Rao",
    company: "Rao Logistics",
    email: "vikram@raologistics.in",
    phone: "+919711223344",
    type: "lead",
    stage: "proposal",
    source: "linkedin",
    campaign: "b2b_outreach",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 350000,
    tags: ["Custom Web App", "Urgent"],
    notes: "Proposal sent. Awaiting feedback on timeline and milestone payments.",
    last_contacted_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    full_name: "Aarav Gupta",
    company: "Sneakinn India",
    email: "aarav@sneakinn.in",
    phone: "+919899001122",
    type: "client",
    stage: "won",
    source: "referral",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 500000,
    tags: ["Retainer", "Design Systems"],
    notes: "Active client. Ongoing UI/UX design contract for mobile app.",
    last_contacted_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    full_name: "Ananya Deshmukh",
    company: "Deshmukh Apparel",
    email: "ananya@deshmukhapparel.in",
    phone: "+919844332211",
    type: "client",
    stage: "active",
    source: "instagram",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 180000,
    tags: ["Performance Marketing"],
    notes: "Monthly ad spend management client. Target ROAS 4.5x achieved.",
    last_contacted_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    full_name: "Rohan Mehta",
    company: "Sohlene Living",
    email: "rohan@sohlene.com",
    phone: "+919755443322",
    type: "lead",
    stage: "new",
    source: "facebook",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 120000,
    tags: ["Lead Gen"],
    notes: "Inquired about Facebook ads campaign setup and conversion tracking.",
    last_contacted_at: null,
    created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    full_name: "Kavya Iyer",
    company: "Iyer Law Practice",
    email: "kavya@iyerlaw.in",
    phone: "+919633221100",
    type: "lead",
    stage: "contacted",
    source: "manual",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 95000,
    tags: ["Corporate Web"],
    notes: "Met at networking event in Bengaluru. Requested quote for legal website.",
    last_contacted_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "99999999-9999-9999-9999-999999999999",
    full_name: "Devendra Singh",
    company: "Singh Auto Corp",
    email: "dev@singhauto.in",
    phone: "+919522110099",
    type: "lead",
    stage: "lost",
    source: "other",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 75000,
    tags: ["Low Budget"],
    notes: "Decided to build in-house due to internal team availability.",
    last_contacted_at: new Date(now.getTime() - 8 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 8 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    full_name: "Ishaan Malhotra",
    company: "Malhotra Health",
    email: "ishaan@malhotrahealth.com",
    phone: "+919411009988",
    type: "client",
    stage: "active",
    source: "referral",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 320000,
    tags: ["Mobile App", "Flutter"],
    notes: "Retainer for iOS and Android app maintenance and feature updates.",
    last_contacted_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    full_name: "Meera Joshi",
    company: "Joshi Crafts",
    email: "meera@joshicrafts.com",
    phone: "+919300998877",
    type: "lead",
    stage: "proposal",
    source: "website",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 110000,
    tags: ["Shopify"],
    notes: "Proposal review meeting scheduled.",
    last_contacted_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 4 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    full_name: "Tanvi Kapoor",
    company: "Kapoor Digital",
    email: "tanvi@kapoordigital.in",
    phone: "+919299887766",
    type: "client",
    stage: "churned",
    source: "linkedin",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: 160000,
    tags: ["SEO"],
    notes: "Completed 3-month contract successfully.",
    last_contacted_at: new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: "t1111111-1111-1111-1111-111111111111",
    contact_id: "11111111-1111-1111-1111-111111111111",
    title: "Send initial proposal to Rahul",
    description: "Draft scope of work for Shopify store revamp.",
    due_at: new Date(now.getTime() + 2 * 3600 * 1000).toISOString(),
    remind_at: new Date(now.getTime() + 1 * 3600 * 1000).toISOString(),
    priority: "high",
    status: "open",
    completed_at: null,
    reminded_at: null,
    created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "t2222222-2222-2222-2222-222222222222",
    contact_id: "22222222-2222-2222-2222-222222222222",
    title: "Follow up with Priya Sharma on WhatsApp",
    description: "Check if she reviewed the PDF brochure.",
    due_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    remind_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    priority: "medium",
    status: "open",
    completed_at: null,
    reminded_at: null,
    created_at: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
  },
  {
    id: "t3333333-3333-3333-3333-333333333333",
    contact_id: "44444444-4444-4444-4444-444444444444",
    title: "Review custom quote with Vikramaditya",
    description: "Schedule clarification call for dev timeline.",
    due_at: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(),
    remind_at: new Date(now.getTime() + 20 * 3600 * 1000).toISOString(),
    priority: "high",
    status: "open",
    completed_at: null,
    reminded_at: null,
    created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "t4444444-4444-4444-4444-444444444444",
    contact_id: "55555555-5555-5555-5555-555555555555",
    title: "Send Sneakinn monthly performance report",
    description: "Compile Google Analytics & Shopify sales stats.",
    due_at: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
    remind_at: new Date(now.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
    priority: "medium",
    status: "open",
    completed_at: null,
    reminded_at: null,
    created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_MEETINGS: MeetingItem[] = [
  {
    id: "m1111111-1111-1111-1111-111111111111",
    contact_id: "33333333-3333-3333-3333-333333333333",
    title: "Discovery Call with Sneha Patel",
    starts_at: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
    ends_at: new Date(now.getTime() + 3.5 * 3600 * 1000).toISOString(),
    mode: "video",
    location_or_link: "https://meet.google.com/abc-defg-hij",
    agenda: "Discuss SEO scope and organic strategy",
    status: "scheduled",
    remind_minutes_before: 30,
    reminded_at: null,
    created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "m2222222-2222-2222-2222-222222222222",
    contact_id: "77777777-7777-7777-7777-777777777777",
    title: "Introductory Call with Rohan Mehta",
    starts_at: new Date(now.getTime() + 26 * 3600 * 1000).toISOString(),
    ends_at: new Date(now.getTime() + 26.5 * 3600 * 1000).toISOString(),
    mode: "call",
    location_or_link: "+91 97554 43322",
    agenda: "Understand Facebook Ad campaign targets",
    status: "scheduled",
    remind_minutes_before: 30,
    reminded_at: null,
    created_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    contact_id: "11111111-1111-1111-1111-111111111111",
    type: "created",
    body: "Inbound lead received via Instagram Bio Link.",
    meta: {},
    created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    contact_id: "22222222-2222-2222-2222-222222222222",
    type: "whatsapp",
    body: "Sent initial introductory message & agency credentials portfolio.",
    meta: {},
    created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    contact_id: "44444444-4444-4444-4444-444444444444",
    type: "stage_change",
    body: "Moved stage from Qualified to Proposal.",
    meta: { old_stage: "qualified", new_stage: "proposal" },
    created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    contact_id: "55555555-5555-5555-5555-555555555555",
    type: "stage_change",
    body: "Moved stage from Proposal to Won.",
    meta: { old_stage: "proposal", new_stage: "won" },
    created_at: new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_SETTINGS: SettingsItem = {
  id: 1,
  whatsapp_number: process.env.CALLMEBOT_PHONE || "+919876543210",
  callmebot_key: process.env.CALLMEBOT_APIKEY || "",
  digest_hour: 8,
  digest_minute: 30,
  quiet_start: 22,
  quiet_end: 8,
  stale_lead_days: 7,
  notify_new_lead: true,
  notify_task_due: true,
  notify_meeting: true,
  notify_digest: true,
  redact_pii: true,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
};

export const INITIAL_CAPTURE_LINKS: CaptureLinkItem[] = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    slug: "instagram-bio",
    label: "Instagram Bio Link",
    source: "instagram",
    campaign: "bio_link",
    created_at: now.toISOString(),
  },
];

// Global in-memory storage for development when Supabase is not connected
class MemoryStore {
  contacts: ContactItem[] = [...INITIAL_CONTACTS];
  tasks: TaskItem[] = [...INITIAL_TASKS];
  meetings: MeetingItem[] = [...INITIAL_MEETINGS];
  activities: ActivityItem[] = [...INITIAL_ACTIVITIES];
  settings: SettingsItem = { ...INITIAL_SETTINGS };
  captureLinks: CaptureLinkItem[] = [...INITIAL_CAPTURE_LINKS];
  notificationLog: Array<{ id: string; kind: string; dedupe_key: string; sent_at: string }> = [];
  aiThreads: AIThread[] = [];
  aiMessages: AIMessage[] = [];
  aiUsage: AIUsageItem[] = [];
  agentActions: AgentActionItem[] = [];

  clearDemoData() {
    this.contacts = [];
    this.tasks = [];
    this.meetings = [];
    this.activities = [];
    this.captureLinks = [...INITIAL_CAPTURE_LINKS];
    this.notificationLog = [];
    this.aiThreads = [];
    this.aiMessages = [];
    this.aiUsage = [];
    this.agentActions = [];
  }

  resetToDemoData() {
    this.contacts = [...INITIAL_CONTACTS];
    this.tasks = [...INITIAL_TASKS];
    this.meetings = [...INITIAL_MEETINGS];
    this.activities = [...INITIAL_ACTIVITIES];
    this.captureLinks = [...INITIAL_CAPTURE_LINKS];
    this.notificationLog = [];
    this.aiThreads = [];
    this.aiMessages = [];
    this.aiUsage = [];
    this.agentActions = [];
  }
}

const globalStore = (globalThis as any).__crm_memory_store__ || new MemoryStore();
(globalThis as any).__crm_memory_store__ = globalStore;

export const mockDb = globalStore;
