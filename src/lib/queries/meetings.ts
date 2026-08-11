import { mockDb, MeetingItem } from "@/lib/mockStore";
import { withDb } from "@/lib/queries/db";

export async function getMeetings(): Promise<MeetingItem[]> {
  const { handled, data } = await withDb<MeetingItem[]>((s) =>
    s.from("meetings").select("*").order("starts_at", { ascending: true })
  );
  if (handled) return data ?? [];
  return [...mockDb.meetings].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

export async function createMeeting(
  meetingData: Omit<MeetingItem, "id" | "created_at" | "reminded_at">
): Promise<MeetingItem> {
  const newMeeting: MeetingItem = {
    id: crypto.randomUUID(),
    ...meetingData,
    reminded_at: null,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<MeetingItem>((s) =>
    s.from("meetings").insert(newMeeting).select().single()
  );
  if (handled && data) return data;

  mockDb.meetings.push(newMeeting);
  return newMeeting;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("meetings").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.meetings.length;
  mockDb.meetings = mockDb.meetings.filter((m: MeetingItem) => m.id !== id);
  return mockDb.meetings.length < initialLen;
}
