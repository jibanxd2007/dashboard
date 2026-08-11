import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, SettingsItem } from "@/lib/mockStore";

export async function getSettings(): Promise<SettingsItem> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (!error && data) return data as SettingsItem;
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return { ...mockDb.settings };
}

export async function updateSettings(fields: Partial<Omit<SettingsItem, "id" | "created_at">>): Promise<SettingsItem> {
  const updated_at = new Date().toISOString();
  const updatePayload = { ...fields, updated_at };

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("settings")
        .update(updatePayload as any)
        .eq("id", 1)
        .select()
        .single();
      if (!error && data) return data as SettingsItem;
    } catch (e) {
      console.warn("Supabase update failed, falling back to mockDb:", e);
    }
  }

  mockDb.settings = {
    ...mockDb.settings,
    ...updatePayload,
  };
  return mockDb.settings;
}
