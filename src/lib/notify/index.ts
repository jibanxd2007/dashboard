import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb } from "@/lib/mockStore";
import { NotificationKind } from "@/lib/database.types";
import { getSettings } from "@/lib/queries/settings";

export async function sendWhatsApp(message: string): Promise<{ success: boolean; provider: string; error?: string }> {
  const settings = await getSettings();
  const provider = (process.env.WHATSAPP_PROVIDER || "callmebot").toLowerCase();
  const phone = settings.whatsapp_number || process.env.CALLMEBOT_PHONE || "+919876543210";
  const apiKey = settings.callmebot_key || process.env.CALLMEBOT_APIKEY || "XojF4J8haTSy";

  // TextMeBot Provider
  if (provider === "textmebot" || apiKey === "XojF4J8haTSy") {
    try {
      const formattedPhone = phone.replace(/[^0-9]/g, "");
      const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(formattedPhone)}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(message)}`;
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        return { success: true, provider: "textmebot" };
      }
    } catch (e: any) {
      console.warn("[WhatsApp TextMeBot Fallback to CallMeBot]", e);
    }
  }

  // CallMeBot Provider
  if (phone && apiKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        return { success: true, provider: "callmebot" };
      } else {
        const text = await res.text();
        return { success: false, provider: "callmebot", error: `CallMeBot HTTP ${res.status}: ${text}` };
      }
    } catch (e: any) {
      console.error("[WhatsApp CallMeBot Error]", e);
      return { success: false, provider: "callmebot", error: e.message || String(e) };
    }
  }

  if (provider === "meta") {
    console.log("[WhatsApp Meta Stub]", message);
    return { success: true, provider: "meta_stub" };
  }

  // Fallback to console logger
  console.log("==========================================");
  console.log("[WHATSAPP NOTIFICATION SENT TO OWNER]");
  console.log(message);
  console.log("==========================================");
  return { success: true, provider: "console" };
}

export async function notify(
  kind: NotificationKind,
  dedupeKey: string,
  message: string,
  refId?: string
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const settings = await getSettings();
  if (kind === "new_lead" && !settings.notify_new_lead) return { sent: false, skipped: true };
  if (kind === "task_due" && !settings.notify_task_due) return { sent: false, skipped: true };
  if (kind === "meeting_soon" && !settings.notify_meeting) return { sent: false, skipped: true };
  if (kind === "daily_digest" && !settings.notify_digest) return { sent: false, skipped: true };

  let isDuplicate = false;
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data } = await supabase
        .from("notification_log")
        .select("id")
        .eq("dedupe_key", dedupeKey)
        .maybeSingle();
      if (data) isDuplicate = true;
    } catch (e) {
      console.warn("Notification log lookup fallback:", e);
    }
  }

  if (!isDuplicate) {
    isDuplicate = mockDb.notificationLog.some((n: any) => n.dedupe_key === dedupeKey);
  }

  if (isDuplicate) {
    return { sent: false, skipped: true };
  }

  const result = await sendWhatsApp(message);
  const statusStr = result.success ? "sent" : "failed";
  const errStr = result.error || undefined;
  const now = new Date().toISOString();

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      await supabase.from("notification_log").insert({
        kind,
        ref_id: refId || null,
        dedupe_key: dedupeKey,
        status: statusStr,
        error: errStr || null,
        sent_at: now,
      } as any);
    } catch (e) {
      console.warn("Notification log insert fallback:", e);
    }
  }

  mockDb.notificationLog.push({
    id: "n_" + crypto.randomUUID(),
    kind,
    dedupe_key: dedupeKey,
    sent_at: now,
  });

  return { sent: result.success, error: errStr };
}
