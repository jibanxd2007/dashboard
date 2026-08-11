import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, ContactItem } from "@/lib/mockStore";
import { ContactStage, ContactType, ContactSource } from "@/lib/database.types";

export async function getContacts(): Promise<ContactItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as ContactItem[];
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return [...mockDb.contacts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getContactById(id: string): Promise<ContactItem | null> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) return data as ContactItem;
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return mockDb.contacts.find((c: ContactItem) => c.id === id) || null;
}

export async function updateContactStage(id: string, stage: ContactStage): Promise<ContactItem | null> {
  const updated_at = new Date().toISOString();
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("contacts")
        .update({ stage, updated_at } as any)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as ContactItem;
    } catch (e) {
      console.warn("Supabase update failed, falling back to mockDb:", e);
    }
  }

  const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === id);
  if (index !== -1) {
    mockDb.contacts[index] = {
      ...mockDb.contacts[index],
      stage,
      updated_at,
    };
    return mockDb.contacts[index];
  }
  return null;
}

export async function updateContactFields(
  id: string,
  fields: Partial<Omit<ContactItem, "id" | "created_at">>
): Promise<ContactItem | null> {
  const updated_at = new Date().toISOString();
  const updatePayload = { ...fields, updated_at };

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("contacts")
        .update(updatePayload as any)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as ContactItem;
    } catch (e) {
      console.warn("Supabase update failed, falling back to mockDb:", e);
    }
  }

  const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === id);
  if (index !== -1) {
    mockDb.contacts[index] = {
      ...mockDb.contacts[index],
      ...updatePayload,
    };
    return mockDb.contacts[index];
  }
  return null;
}

export async function createContact(
  contactData: Omit<ContactItem, "id" | "created_at" | "updated_at">
): Promise<ContactItem> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const newContact: ContactItem = {
    id,
    ...contactData,
    created_at: now,
    updated_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("contacts")
        .insert(newContact as any)
        .select()
        .single();
      if (!error && data) return data as ContactItem;
    } catch (e) {
      console.warn("Supabase insert failed, falling back to mockDb:", e);
    }
  }

  mockDb.contacts.unshift(newContact);
  return newContact;
}

export async function deleteContact(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (!error) return true;
    } catch (e) {
      console.warn("Supabase delete failed, falling back to mockDb:", e);
    }
  }

  const initialLen = mockDb.contacts.length;
  mockDb.contacts = mockDb.contacts.filter((c: ContactItem) => c.id !== id);
  return mockDb.contacts.length < initialLen;
}
