import { mockDb, ActivityItem } from "@/lib/mockStore";
import { ActivityType } from "@/lib/database.types";
import { withDb } from "@/lib/queries/db";

export async function getActivities(contactId?: string): Promise<ActivityItem[]> {
  const { handled, data } = await withDb<ActivityItem[]>((s) => {
    let query = s.from("activities").select("*").order("created_at", { ascending: false });
    if (contactId) query = query.eq("contact_id", contactId);
    return query;
  });
  if (handled) return data ?? [];

  let list = [...mockDb.activities];
  if (contactId) list = list.filter((a) => a.contact_id === contactId);
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function logActivity(
  contactId: string,
  type: ActivityType,
  body: string,
  meta: Record<string, any> = {}
): Promise<ActivityItem> {
  const newActivity: ActivityItem = {
    id: crypto.randomUUID(),
    contact_id: contactId,
    type,
    body,
    meta,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<ActivityItem>((s) =>
    s.from("activities").insert(newActivity).select().single()
  );
  if (handled && data) return data;

  mockDb.activities.unshift(newActivity);
  return newActivity;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("activities").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.activities.length;
  mockDb.activities = mockDb.activities.filter((a: ActivityItem) => a.id !== id);
  return mockDb.activities.length < initialLen;
}

export const getActivitiesByContactId = getActivities;

export async function createActivity(data: {
  contact_id: string;
  type: ActivityType;
  body: string;
  meta?: Record<string, any>;
}) {
  return logActivity(data.contact_id, data.type, data.body, data.meta || {});
}
