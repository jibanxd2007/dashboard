export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContactType = 'lead' | 'client';
export type ContactStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'active' | 'churned';
export type ContactSource = 'instagram' | 'facebook' | 'whatsapp' | 'linkedin' | 'website' | 'referral' | 'manual' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'done';
export type MeetingMode = 'call' | 'video' | 'in_person';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type ActivityType = 'note' | 'call' | 'whatsapp' | 'email' | 'meeting' | 'stage_change' | 'created';
export type NotificationKind = 'task_due' | 'meeting_soon' | 'new_lead' | 'daily_digest' | 'stale_lead';
export type TeamRole = 'owner' | 'manager' | 'member';
export type TeamMemberStatus = 'active' | 'inactive';

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          full_name: string
          company: string | null
          email: string | null
          phone: string
          type: ContactType
          stage: ContactStage
          source: ContactSource
          campaign: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          deal_value: number
          tags: string[]
          notes: string | null
          last_contacted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          company?: string | null
          email?: string | null
          phone: string
          type?: ContactType
          stage?: ContactStage
          source?: ContactSource
          campaign?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          deal_value?: number
          tags?: string[]
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          company?: string | null
          email?: string | null
          phone?: string
          type?: ContactType
          stage?: ContactStage
          source?: ContactSource
          campaign?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          deal_value?: number
          tags?: string[]
          notes?: string | null
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          contact_id: string | null
          title: string
          description: string | null
          due_at: string | null
          remind_at: string | null
          priority: TaskPriority
          status: TaskStatus
          completed_at: string | null
          reminded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          title: string
          description?: string | null
          due_at?: string | null
          remind_at?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          completed_at?: string | null
          reminded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          title?: string
          description?: string | null
          due_at?: string | null
          remind_at?: string | null
          priority?: TaskPriority
          status?: TaskStatus
          completed_at?: string | null
          reminded_at?: string | null
          created_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          contact_id: string
          title: string
          starts_at: string
          ends_at: string
          mode: MeetingMode
          location_or_link: string | null
          agenda: string | null
          status: MeetingStatus
          remind_minutes_before: number
          reminded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          title: string
          starts_at: string
          ends_at: string
          mode?: MeetingMode
          location_or_link?: string | null
          agenda?: string | null
          status?: MeetingStatus
          remind_minutes_before?: number
          reminded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          title?: string
          starts_at?: string
          ends_at?: string
          mode?: MeetingMode
          location_or_link?: string | null
          agenda?: string | null
          status?: MeetingStatus
          remind_minutes_before?: number
          reminded_at?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          contact_id: string
          type: ActivityType
          body: string
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          type: ActivityType
          body: string
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          type?: ActivityType
          body?: string
          meta?: Json
          created_at?: string
        }
      }
      notification_log: {
        Row: {
          id: string
          kind: NotificationKind
          ref_id: string | null
          dedupe_key: string
          status: string
          error: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          kind: NotificationKind
          ref_id?: string | null
          dedupe_key: string
          status?: string
          error?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          kind?: NotificationKind
          ref_id?: string | null
          dedupe_key?: string
          status?: string
          error?: string | null
          sent_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          whatsapp_number: string
          callmebot_key: string
          digest_hour: number
          digest_minute: number
          quiet_start: number
          quiet_end: number
          stale_lead_days: number
          notify_new_lead: boolean
          notify_task_due: boolean
          notify_meeting: boolean
          notify_digest: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          whatsapp_number?: string
          callmebot_key?: string
          digest_hour?: number
          digest_minute?: number
          quiet_start?: number
          quiet_end?: number
          stale_lead_days?: number
          notify_new_lead?: boolean
          notify_task_due?: boolean
          notify_meeting?: boolean
          notify_digest?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          whatsapp_number?: string
          callmebot_key?: string
          digest_hour?: number
          digest_minute?: number
          quiet_start?: number
          quiet_end?: number
          stale_lead_days?: number
          notify_new_lead?: boolean
          notify_task_due?: boolean
          notify_meeting?: boolean
          notify_digest?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          role: TeamRole
          title: string | null
          status: TeamMemberStatus
          joined_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          phone?: string | null
          role?: TeamRole
          title?: string | null
          status?: TeamMemberStatus
          joined_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          role?: TeamRole
          title?: string | null
          status?: TeamMemberStatus
          joined_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_meetings: {
        Row: {
          id: string
          title: string
          starts_at: string
          ends_at: string
          mode: MeetingMode
          location_or_link: string | null
          agenda: string | null
          status: MeetingStatus
          attendee_ids: string[]
          remind_minutes_before: number
          reminded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          starts_at: string
          ends_at: string
          mode?: MeetingMode
          location_or_link?: string | null
          agenda?: string | null
          status?: MeetingStatus
          attendee_ids?: string[]
          remind_minutes_before?: number
          reminded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          starts_at?: string
          ends_at?: string
          mode?: MeetingMode
          location_or_link?: string | null
          agenda?: string | null
          status?: MeetingStatus
          attendee_ids?: string[]
          remind_minutes_before?: number
          reminded_at?: string | null
          created_at?: string
        }
      }
      capture_links: {
        Row: {
          id: string
          slug: string
          label: string
          source: ContactSource
          campaign: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          label: string
          source?: ContactSource
          campaign?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          label?: string
          source?: ContactSource
          campaign?: string | null
          created_at?: string
        }
      }
    }
  }
}
