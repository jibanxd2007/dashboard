import {
  mockDb,
  DeliverableItem,
  DeliverableChecklistItem,
  ClientLinkItem,
  DeliverableStatus,
} from "@/lib/mockStore";
import { withDb } from "@/lib/queries/db";

export const OPEN_STATUSES: DeliverableStatus[] = [
  "not_started",
  "in_progress",
  "in_review",
  "blocked",
];

export async function getDeliverables(clientId?: string): Promise<DeliverableItem[]> {
  const { handled, data } = await withDb<DeliverableItem[]>((s) => {
    let q = s.from("deliverables").select("*").order("due_at", { ascending: true, nullsFirst: false });
    if (clientId) q = q.eq("client_id", clientId);
    return q;
  });
  if (handled) return data ?? [];

  const list = clientId
    ? mockDb.deliverables.filter((d) => d.client_id === clientId)
    : [...mockDb.deliverables];
  return list.sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
}

export async function getDeliverableById(id: string): Promise<DeliverableItem | null> {
  const { handled, data } = await withDb<DeliverableItem>((s) =>
    s.from("deliverables").select("*").eq("id", id).maybeSingle()
  );
  if (handled) return data;
  return mockDb.deliverables.find((d) => d.id === id) || null;
}

export async function createDeliverable(
  input: Omit<DeliverableItem, "id" | "created_at" | "updated_at" | "delivered_at" | "blocked_since">
): Promise<DeliverableItem> {
  const now = new Date().toISOString();
  const row: DeliverableItem = {
    id: crypto.randomUUID(),
    ...input,
    blocked_since: input.status === "blocked" ? now : null,
    delivered_at: null,
    created_at: now,
    updated_at: now,
  };

  const { handled, data } = await withDb<DeliverableItem>((s) =>
    s.from("deliverables").insert(row).select().single()
  );
  if (handled && data) return data;

  mockDb.deliverables.unshift(row);
  return row;
}

export async function updateDeliverable(
  id: string,
  fields: Partial<Omit<DeliverableItem, "id" | "created_at">>
): Promise<DeliverableItem | null> {
  const payload: Record<string, any> = { ...fields, updated_at: new Date().toISOString() };

  // Keep the derived timestamps consistent with whatever status is being set.
  if (fields.status) {
    const now = new Date().toISOString();
    if (fields.status === "blocked") {
      const existing = await getDeliverableById(id);
      payload.blocked_since = existing?.blocked_since || now;
    } else {
      payload.blocked_since = null;
      payload.blocked_reason = null;
    }
    if (fields.status === "delivered" || fields.status === "approved") {
      const existing = await getDeliverableById(id);
      payload.delivered_at = existing?.delivered_at || now;
    } else {
      payload.delivered_at = null;
    }
  }

  const { handled, data } = await withDb<DeliverableItem>((s) =>
    s.from("deliverables").update(payload).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const index = mockDb.deliverables.findIndex((d) => d.id === id);
  if (index !== -1) {
    mockDb.deliverables[index] = { ...mockDb.deliverables[index], ...payload };
    return mockDb.deliverables[index];
  }
  return null;
}

export async function deleteDeliverable(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("deliverables").delete().eq("id", id));
  if (handled) return true;

  const before = mockDb.deliverables.length;
  mockDb.deliverables = mockDb.deliverables.filter((d) => d.id !== id);
  mockDb.deliverableItems = mockDb.deliverableItems.filter((i) => i.deliverable_id !== id);
  return mockDb.deliverables.length < before;
}

// --- Checklist items ---

export async function getDeliverableItems(deliverableId?: string): Promise<DeliverableChecklistItem[]> {
  const { handled, data } = await withDb<DeliverableChecklistItem[]>((s) => {
    let q = s.from("deliverable_items").select("*").order("position", { ascending: true });
    if (deliverableId) q = q.eq("deliverable_id", deliverableId);
    return q;
  });
  if (handled) return data ?? [];

  const list = deliverableId
    ? mockDb.deliverableItems.filter((i) => i.deliverable_id === deliverableId)
    : [...mockDb.deliverableItems];
  return list.sort((a, b) => a.position - b.position);
}

export async function addDeliverableItem(
  deliverableId: string,
  label: string
): Promise<DeliverableChecklistItem> {
  const siblings = await getDeliverableItems(deliverableId);
  const row: DeliverableChecklistItem = {
    id: crypto.randomUUID(),
    deliverable_id: deliverableId,
    label,
    done: false,
    position: siblings.length,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<DeliverableChecklistItem>((s) =>
    s.from("deliverable_items").insert(row).select().single()
  );
  if (handled && data) return data;

  mockDb.deliverableItems.push(row);
  return row;
}

export async function setDeliverableItemDone(
  id: string,
  done: boolean
): Promise<DeliverableChecklistItem | null> {
  const { handled, data } = await withDb<DeliverableChecklistItem>((s) =>
    s.from("deliverable_items").update({ done }).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const item = mockDb.deliverableItems.find((i) => i.id === id);
  if (item) {
    item.done = done;
    return { ...item };
  }
  return null;
}

export async function deleteDeliverableItem(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("deliverable_items").delete().eq("id", id));
  if (handled) return true;

  const before = mockDb.deliverableItems.length;
  mockDb.deliverableItems = mockDb.deliverableItems.filter((i) => i.id !== id);
  return mockDb.deliverableItems.length < before;
}

// --- Client links ---

export async function getClientLinks(clientId?: string): Promise<ClientLinkItem[]> {
  const { handled, data } = await withDb<ClientLinkItem[]>((s) => {
    let q = s.from("client_links").select("*").order("created_at", { ascending: true });
    if (clientId) q = q.eq("client_id", clientId);
    return q;
  });
  if (handled) return data ?? [];

  return clientId
    ? mockDb.clientLinks.filter((l) => l.client_id === clientId)
    : [...mockDb.clientLinks];
}

export async function createClientLink(
  clientId: string,
  label: string,
  url: string
): Promise<ClientLinkItem> {
  const row: ClientLinkItem = {
    id: crypto.randomUUID(),
    client_id: clientId,
    label,
    url,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<ClientLinkItem>((s) =>
    s.from("client_links").insert(row).select().single()
  );
  if (handled && data) return data;

  mockDb.clientLinks.push(row);
  return row;
}

export async function deleteClientLink(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("client_links").delete().eq("id", id));
  if (handled) return true;

  const before = mockDb.clientLinks.length;
  mockDb.clientLinks = mockDb.clientLinks.filter((l) => l.id !== id);
  return mockDb.clientLinks.length < before;
}

/** Overdue count, next deadline and progress — the "most at risk" sort key. */
export function summariseClient(deliverables: DeliverableItem[], now = new Date()) {
  const open = deliverables.filter((d) => OPEN_STATUSES.includes(d.status));
  const overdue = open.filter((d) => d.due_at && new Date(d.due_at) < now);
  const done = deliverables.filter((d) => d.status === "delivered" || d.status === "approved");

  const upcoming = open
    .filter((d) => d.due_at && new Date(d.due_at) >= now)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());

  return {
    total: deliverables.length,
    delivered: done.length,
    overdueCount: overdue.length,
    nextDueAt: upcoming[0]?.due_at ?? null,
    unbilledValue: open.reduce((sum, d) => sum + (d.value || 0), 0),
  };
}
