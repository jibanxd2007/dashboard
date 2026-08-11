import { mockDb, ContactItem } from "@/lib/mockStore";
import { ContactStage } from "@/lib/database.types";
import { withDb } from "@/lib/queries/db";

export async function getContacts(): Promise<ContactItem[]> {
  const { handled, data } = await withDb<ContactItem[]>((s) =>
    s.from("contacts").select("*").order("created_at", { ascending: false })
  );
  if (handled) return data ?? [];
  return [...mockDb.contacts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getContactById(id: string): Promise<ContactItem | null> {
  const { handled, data } = await withDb<ContactItem>((s) =>
    s.from("contacts").select("*").eq("id", id).maybeSingle()
  );
  if (handled) return data;
  return mockDb.contacts.find((c: ContactItem) => c.id === id) || null;
}

export async function updateContactStage(id: string, stage: ContactStage): Promise<ContactItem | null> {
  return updateContactFields(id, { stage });
}

export async function updateContactFields(
  id: string,
  fields: Partial<Omit<ContactItem, "id" | "created_at">>
): Promise<ContactItem | null> {
  const updatePayload = { ...fields, updated_at: new Date().toISOString() };

  const { handled, data } = await withDb<ContactItem>((s) =>
    s.from("contacts").update(updatePayload).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === id);
  if (index !== -1) {
    mockDb.contacts[index] = { ...mockDb.contacts[index], ...updatePayload };
    return mockDb.contacts[index];
  }
  return null;
}

export async function createContact(
  contactData: Omit<ContactItem, "id" | "created_at" | "updated_at">
): Promise<ContactItem> {
  const now = new Date().toISOString();
  const newContact: ContactItem = {
    id: crypto.randomUUID(),
    ...contactData,
    created_at: now,
    updated_at: now,
  };

  const { handled, data } = await withDb<ContactItem>((s) =>
    s.from("contacts").insert(newContact).select().single()
  );
  if (handled && data) return data;

  mockDb.contacts.unshift(newContact);
  return newContact;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("contacts").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.contacts.length;
  mockDb.contacts = mockDb.contacts.filter((c: ContactItem) => c.id !== id);
  return mockDb.contacts.length < initialLen;
}

/** Moves every contact in one stage to another. Returns the number updated. */
export async function bulkUpdateStage(fromStage: ContactStage, toStage: ContactStage): Promise<number> {
  const updated_at = new Date().toISOString();

  const { handled, data } = await withDb<ContactItem[]>((s) =>
    s.from("contacts").update({ stage: toStage, updated_at }).eq("stage", fromStage).select()
  );
  if (handled) return data?.length ?? 0;

  let count = 0;
  for (const c of mockDb.contacts) {
    if (c.stage === fromStage) {
      c.stage = toStage;
      c.updated_at = updated_at;
      count++;
    }
  }
  return count;
}
