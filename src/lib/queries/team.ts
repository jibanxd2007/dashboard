import { mockDb, TeamMemberItem, TeamMeetingItem } from "@/lib/mockStore";
import { withDb } from "@/lib/queries/db";

// --- Team members ---

export async function getTeamMembers(): Promise<TeamMemberItem[]> {
  const { handled, data } = await withDb<TeamMemberItem[]>((s) =>
    s.from("team_members").select("*").order("created_at", { ascending: true })
  );
  if (handled) return data ?? [];
  return [...mockDb.teamMembers].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function getTeamMemberById(id: string): Promise<TeamMemberItem | null> {
  const { handled, data } = await withDb<TeamMemberItem>((s) =>
    s.from("team_members").select("*").eq("id", id).maybeSingle()
  );
  if (handled) return data;
  return mockDb.teamMembers.find((m: TeamMemberItem) => m.id === id) || null;
}

export async function createTeamMember(
  memberData: Omit<TeamMemberItem, "id" | "created_at" | "updated_at">
): Promise<TeamMemberItem> {
  const now = new Date().toISOString();
  const newMember: TeamMemberItem = {
    id: crypto.randomUUID(),
    ...memberData,
    created_at: now,
    updated_at: now,
  };

  const { handled, data } = await withDb<TeamMemberItem>((s) =>
    s.from("team_members").insert(newMember).select().single()
  );
  if (handled && data) return data;

  mockDb.teamMembers.push(newMember);
  return newMember;
}

export async function updateTeamMember(
  id: string,
  fields: Partial<Omit<TeamMemberItem, "id" | "created_at">>
): Promise<TeamMemberItem | null> {
  const updatePayload = { ...fields, updated_at: new Date().toISOString() };

  const { handled, data } = await withDb<TeamMemberItem>((s) =>
    s.from("team_members").update(updatePayload).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const index = mockDb.teamMembers.findIndex((m: TeamMemberItem) => m.id === id);
  if (index !== -1) {
    mockDb.teamMembers[index] = { ...mockDb.teamMembers[index], ...updatePayload };
    return mockDb.teamMembers[index];
  }
  return null;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  // Drop the member from any meeting they were invited to, so attendee lists
  // never point at someone who no longer exists.
  const meetings = await getTeamMeetings();
  await Promise.all(
    meetings
      .filter((m) => (m.attendee_ids || []).includes(id))
      .map((m) =>
        updateTeamMeeting(m.id, { attendee_ids: m.attendee_ids.filter((a) => a !== id) })
      )
  );

  const { handled } = await withDb((s) => s.from("team_members").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.teamMembers.length;
  mockDb.teamMembers = mockDb.teamMembers.filter((m: TeamMemberItem) => m.id !== id);
  return mockDb.teamMembers.length < initialLen;
}

// --- Team meetings ---

export async function getTeamMeetings(): Promise<TeamMeetingItem[]> {
  const { handled, data } = await withDb<TeamMeetingItem[]>((s) =>
    s.from("team_meetings").select("*").order("starts_at", { ascending: true })
  );
  if (handled) return data ?? [];
  return [...mockDb.teamMeetings].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

export async function createTeamMeeting(
  meetingData: Omit<TeamMeetingItem, "id" | "created_at" | "reminded_at">
): Promise<TeamMeetingItem> {
  const newMeeting: TeamMeetingItem = {
    id: crypto.randomUUID(),
    ...meetingData,
    reminded_at: null,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<TeamMeetingItem>((s) =>
    s.from("team_meetings").insert(newMeeting).select().single()
  );
  if (handled && data) return data;

  mockDb.teamMeetings.push(newMeeting);
  return newMeeting;
}

export async function updateTeamMeeting(
  id: string,
  fields: Partial<Omit<TeamMeetingItem, "id" | "created_at">>
): Promise<TeamMeetingItem | null> {
  const { handled, data } = await withDb<TeamMeetingItem>((s) =>
    s.from("team_meetings").update(fields).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const index = mockDb.teamMeetings.findIndex((m: TeamMeetingItem) => m.id === id);
  if (index !== -1) {
    mockDb.teamMeetings[index] = { ...mockDb.teamMeetings[index], ...fields };
    return mockDb.teamMeetings[index];
  }
  return null;
}

export async function deleteTeamMeeting(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("team_meetings").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.teamMeetings.length;
  mockDb.teamMeetings = mockDb.teamMeetings.filter((m: TeamMeetingItem) => m.id !== id);
  return mockDb.teamMeetings.length < initialLen;
}
