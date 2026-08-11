import { mockDb, EmailLogItem } from "@/lib/mockStore";
import { withDb } from "@/lib/queries/db";

export async function isEmailAlreadySent(dedupeKey: string): Promise<boolean> {
  const { handled, data } = await withDb<{ id: string }>((s) =>
    s.from("email_log").select("id").eq("dedupe_key", dedupeKey).eq("status", "sent").maybeSingle()
  );
  if (handled) return Boolean(data);
  return mockDb.emailLog.some((e) => e.dedupe_key === dedupeKey && e.status === "sent");
}

export async function logEmail(entry: {
  toEmail: string;
  template: string;
  subject: string;
  refId?: string;
  dedupeKey?: string;
  status: string;
  providerId?: string;
  error?: string;
}): Promise<void> {
  const row: EmailLogItem = {
    id: crypto.randomUUID(),
    to_email: entry.toEmail,
    template: entry.template,
    subject: entry.subject,
    ref_id: entry.refId || null,
    dedupe_key: entry.dedupeKey || `${entry.template}_${crypto.randomUUID()}`,
    status: entry.status,
    provider_id: entry.providerId || null,
    error: entry.error || null,
    sent_at: new Date().toISOString(),
  };

  const { handled } = await withDb((s) => s.from("email_log").insert(row));
  if (handled) return;

  mockDb.emailLog.unshift(row);
}

export async function getEmailLog(refId?: string): Promise<EmailLogItem[]> {
  const { handled, data } = await withDb<EmailLogItem[]>((s) => {
    let q = s.from("email_log").select("*").order("sent_at", { ascending: false });
    if (refId) q = q.eq("ref_id", refId);
    return q;
  });
  if (handled) return data ?? [];

  const list = refId ? mockDb.emailLog.filter((e) => e.ref_id === refId) : [...mockDb.emailLog];
  return list.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
}

export async function countEmailsSince(prefix: string, since: Date): Promise<number> {
  const { handled, data } = await withDb<Array<{ dedupe_key: string }>>((s) =>
    s
      .from("email_log")
      .select("dedupe_key")
      .like("dedupe_key", `${prefix}%`)
      .eq("status", "sent")
      .gte("sent_at", since.toISOString())
  );
  if (handled) return data?.length ?? 0;

  return mockDb.emailLog.filter(
    (e) => e.dedupe_key.startsWith(prefix) && e.status === "sent" && new Date(e.sent_at) >= since
  ).length;
}
