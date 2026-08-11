import { ContactStage, ContactType, ContactSource, TaskPriority, TaskStatus, MeetingMode, MeetingStatus, ActivityType, TeamRole, TeamMemberStatus } from "@/lib/database.types";

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

export type AttendeeReminder = "none" | "day" | "hour" | "both";

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
  /** Pasted Meet/Zoom URL. Distinct from location_or_link for in-person venues. */
  meeting_link?: string | null;
  additional_recipients?: string[];
  invite_sent_at?: string | null;
  /** Bumped on every edit so calendars amend rather than duplicate. */
  invite_sequence?: number;
  attendee_reminder?: AttendeeReminder;
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

export interface TeamMemberItem {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: TeamRole;
  title: string | null;
  status: TeamMemberStatus;
  joined_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Internal meeting. Client-facing meetings live in MeetingItem. */
export interface TeamMeetingItem {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  mode: MeetingMode;
  location_or_link: string | null;
  agenda: string | null;
  status: MeetingStatus;
  attendee_ids: string[];
  remind_minutes_before: number;
  reminded_at: string | null;
  created_at: string;
}

export type DeliverableType = "design" | "development" | "content" | "campaign" | "report" | "other";
export type DeliverableStatus =
  | "not_started"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "delivered"
  | "approved";

export interface DeliverableItem {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  type: DeliverableType;
  status: DeliverableStatus;
  priority: TaskPriority;
  due_at: string | null;
  owner_id: string | null;
  value: number | null;
  /** Hours before due_at at which to remind. */
  remind_offsets: number[];
  blocked_reason: string | null;
  blocked_since: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliverableChecklistItem {
  id: string;
  deliverable_id: string;
  label: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface ClientLinkItem {
  id: string;
  client_id: string;
  label: string;
  url: string;
  created_at: string;
}

export interface EmailLogItem {
  id: string;
  to_email: string;
  template: string;
  subject: string;
  ref_id: string | null;
  dedupe_key: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  sent_at: string;
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

/**
 * Default settings for a fresh install. Notification credentials come from the
 * environment; everything else is a neutral starting value the user edits in
 * Settings. No contacts, tasks, meetings or capture links are pre-created —
 * this CRM starts empty and fills up with real data only.
 */
export const INITIAL_SETTINGS: SettingsItem = {
  id: 1,
  whatsapp_number: process.env.CALLMEBOT_PHONE || "",
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

/**
 * In-memory fallback store, used only when Supabase is not configured.
 *
 * WARNING: this store is process-local and is wiped on every server restart,
 * rebuild, and (on serverless hosts) between requests. It exists so the app can
 * boot for local UI work — it is NOT a database. Configure Supabase before
 * entering real client data. See isDatabaseConfigured() in lib/supabase/server.
 */
class MemoryStore {
  contacts: ContactItem[] = [];
  tasks: TaskItem[] = [];
  meetings: MeetingItem[] = [];
  activities: ActivityItem[] = [];
  settings: SettingsItem = { ...INITIAL_SETTINGS };
  captureLinks: CaptureLinkItem[] = [];
  teamMembers: TeamMemberItem[] = [];
  teamMeetings: TeamMeetingItem[] = [];
  deliverables: DeliverableItem[] = [];
  deliverableItems: DeliverableChecklistItem[] = [];
  clientLinks: ClientLinkItem[] = [];
  emailLog: EmailLogItem[] = [];
  notificationLog: Array<{ id: string; kind: string; dedupe_key: string; sent_at: string }> = [];
  aiThreads: AIThread[] = [];
  aiMessages: AIMessage[] = [];
  aiUsage: AIUsageItem[] = [];
  agentActions: AgentActionItem[] = [];

  /** Erase every record. Settings are preserved. */
  clearAll() {
    this.contacts = [];
    this.tasks = [];
    this.meetings = [];
    this.activities = [];
    this.captureLinks = [];
    this.teamMembers = [];
    this.teamMeetings = [];
    this.deliverables = [];
    this.deliverableItems = [];
    this.clientLinks = [];
    this.emailLog = [];
    this.notificationLog = [];
    this.aiThreads = [];
    this.aiMessages = [];
    this.aiUsage = [];
    this.agentActions = [];
  }
}

const globalStore: MemoryStore =
  (globalThis as any).__crm_memory_store__ || new MemoryStore();
(globalThis as any).__crm_memory_store__ = globalStore;

export const mockDb: MemoryStore = globalStore;
