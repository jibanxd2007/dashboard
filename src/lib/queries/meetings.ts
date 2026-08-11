import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, MeetingItem } from "@/lib/mockStore";
import { MeetingMode, MeetingStatus } from "@/lib/database.types";

export async function getMeetings(): Promise<MeetingItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("starts_at", { ascending: true });
      if (!error && data) return data as MeetingItem[];
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return [...mockDb.meetings].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

export async function createMeeting(
  meetingData: Omit<MeetingItem, "id" | "created_at" | "reminded_at">
): Promise<MeetingItem> {
  const now = new Date().toISOString();
  const id = "m_" + crypto.randomUUID();
  const newMeeting: MeetingItem = {
    id,
    ...meetingData,
    reminded_at: null,
    created_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("meetings")
        .insert(newMeeting as any)
        .select()
        .single();
      if (!error && data) return data as MeetingItem;
    } catch (e) {
      console.warn("Supabase insert failed, falling back to mockDb:", e);
    }
  }

  mockDb.meetings.push(newMeeting);
  return newMeeting;
}
