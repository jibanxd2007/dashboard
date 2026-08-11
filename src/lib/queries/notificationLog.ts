import { mockDb } from "@/lib/mockStore";
import { NotificationKind } from "@/lib/database.types";
import { withDb } from "@/lib/queries/db";

export async function hasNotificationBeenSent(dedupeKey: string): Promise<boolean> {
  const { handled, data } = await withDb<{ id: string }>((s) =>
    s.from("notification_log").select("id").eq("dedupe_key", dedupeKey).maybeSingle()
  );
  if (handled) return Boolean(data);
  return mockDb.notificationLog.some((n: any) => n.dedupe_key === dedupeKey);
}

export async function recordNotification(entry: {
  kind: NotificationKind;
  dedupeKey: string;
  refId?: string;
  status: string;
  error?: string;
}): Promise<void> {
  const sent_at = new Date().toISOString();

  const { handled } = await withDb((s) =>
    s.from("notification_log").insert({
      kind: entry.kind,
      ref_id: entry.refId || null,
      dedupe_key: entry.dedupeKey,
      status: entry.status,
      error: entry.error || null,
      sent_at,
    })
  );
  if (handled) return;

  mockDb.notificationLog.push({
    id: crypto.randomUUID(),
    kind: entry.kind,
    dedupe_key: entry.dedupeKey,
    sent_at,
  });
}

/** Owner alerts already sent today for a given item, for daily escalation caps. */
export async function countNotificationsSince(prefix: string, since: Date): Promise<number> {
  const { handled, data } = await withDb<Array<{ dedupe_key: string; sent_at: string }>>((s) =>
    s
      .from("notification_log")
      .select("dedupe_key, sent_at")
      .like("dedupe_key", `${prefix}%`)
      .gte("sent_at", since.toISOString())
  );
  if (handled) return data?.length ?? 0;

  return mockDb.notificationLog.filter(
    (n: any) => n.dedupe_key.startsWith(prefix) && new Date(n.sent_at) >= since
  ).length;
}
