import { mockDb, SettingsItem } from "@/lib/mockStore";
import { withDb } from "@/lib/queries/db";

export async function getSettings(): Promise<SettingsItem> {
  const { handled, data } = await withDb<SettingsItem>((s) =>
    s.from("settings").select("*").eq("id", 1).maybeSingle()
  );
  // The settings row is created by schema.sql; fall back to defaults if absent.
  if (handled && data) return data;
  if (handled) return { ...mockDb.settings };
  return { ...mockDb.settings };
}

export async function updateSettings(
  fields: Partial<Omit<SettingsItem, "id" | "created_at">>
): Promise<SettingsItem> {
  const updatePayload = { ...fields, updated_at: new Date().toISOString() };

  const { handled, data } = await withDb<SettingsItem>((s) =>
    s.from("settings").update(updatePayload).eq("id", 1).select().maybeSingle()
  );
  if (handled && data) return data;

  mockDb.settings = { ...mockDb.settings, ...updatePayload };
  return mockDb.settings;
}
