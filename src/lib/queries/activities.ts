import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, ActivityItem } from "@/lib/mockStore";
import { ActivityType } from "@/lib/database.types";

export async function getActivities(contactId?: string): Promise<ActivityItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (contactId) {
        query = query.eq("contact_id", contactId);
      }

      const { data, error } = await query;
      if (!error && data) return data as ActivityItem[];
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }

  let list = [...mockDb.activities];
  if (contactId) {
    list = list.filter((a) => a.contact_id === contactId);
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function logActivity(
  contactId: string,
  type: ActivityType,
  body: string,
  meta: Record<string, any> = {}
): Promise<ActivityItem> {
  const now = new Date().toISOString();
  const id = "a_" + crypto.randomUUID();
  const newActivity: ActivityItem = {
    id,
    contact_id: contactId,
    type,
    body,
    meta,
    created_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("activities")
        .insert(newActivity as any)
        .select()
        .single();
      if (!error && data) return data as ActivityItem;
    } catch (e) {
      console.warn("Supabase insert failed, falling back to mockDb:", e);
    }
  }

  mockDb.activities.unshift(newActivity);
  return newActivity;
}

export const getActivitiesByContactId = getActivities;
export async function createActivity(data: { contact_id: string; type: ActivityType; body: string; meta?: Record<string, any> }) {
  return logActivity(data.contact_id, data.type, data.body, data.meta || {});
}

