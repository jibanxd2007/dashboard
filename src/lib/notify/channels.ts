/**
 * The only two ways this app is allowed to notify anyone.
 *
 *   notifyOwner(message)        -> WhatsApp. Reaches the owner and nobody else.
 *   sendEmail(to, template, ..) -> Email. Reaches clients, leads and team.
 *
 * The audiences are deliberately not interchangeable. WhatsApp goes to a single
 * number resolved from configuration here; notifyOwner takes no recipient
 * argument, so there is no code path that can text a client or a team member
 * even by mistake. Every cron job, agent tool and Server Action must route
 * through one of these two functions rather than touching Resend or the
 * WhatsApp transport directly.
 */
import { Resend } from "resend";
import { NotificationKind } from "@/lib/database.types";
import { getSettings } from "@/lib/queries/settings";
import { logEmail, isEmailAlreadySent } from "@/lib/queries/emailLog";
import { hasNotificationBeenSent, recordNotification } from "@/lib/queries/notificationLog";

// --- Owner channel (WhatsApp) ---------------------------------------------

/** Resolves the single number owner alerts may be delivered to. */
async function getOwnerNumber(): Promise<string> {
  const settings = await getSettings();
  return (settings.whatsapp_number || process.env.CALLMEBOT_PHONE || "").trim();
}

async function deliverWhatsApp(
  message: string
): Promise<{ success: boolean; provider: string; error?: string }> {
  const settings = await getSettings();
  const phone = await getOwnerNumber();
  const apiKey = (settings.callmebot_key || process.env.CALLMEBOT_APIKEY || "").trim();
  const provider = (process.env.WHATSAPP_PROVIDER || "callmebot").toLowerCase();

  if (!phone || !apiKey) {
    console.log("[owner:whatsapp:unconfigured]", message);
    return { success: true, provider: "console" };
  }

  if (provider === "console") {
    console.log("[owner:whatsapp:console]", message);
    return { success: true, provider: "console" };
  }

  try {
    const url =
      provider === "textmebot"
        ? `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(phone.replace(/[^0-9]/g, ""))}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(message)}`
        : `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: "GET" });
    if (res.ok) return { success: true, provider };
    return { success: false, provider, error: `HTTP ${res.status}: ${await res.text()}` };
  } catch (e: any) {
    return { success: false, provider, error: e.message || String(e) };
  }
}

export interface OwnerAlertOptions {
  /** Suppressed by quiet hours unless this is true. New leads set it. */
  urgent?: boolean;
  /** Repeat suppression key. Same key never sends twice. */
  dedupeKey?: string;
  kind?: NotificationKind;
  refId?: string;
}

/**
 * Sends a WhatsApp alert to the owner. There is intentionally no recipient
 * parameter — see the file header.
 */
export async function notifyOwner(
  message: string,
  options: OwnerAlertOptions = {}
): Promise<{ sent: boolean; skipped?: boolean; reason?: string; error?: string }> {
  const { urgent = false, dedupeKey, kind = "daily_digest", refId } = options;
  const settings = await getSettings();

  const toggles: Partial<Record<NotificationKind, boolean>> = {
    new_lead: settings.notify_new_lead,
    task_due: settings.notify_task_due,
    meeting_soon: settings.notify_meeting,
    daily_digest: settings.notify_digest,
  };
  if (toggles[kind] === false) {
    return { sent: false, skipped: true, reason: "trigger disabled in settings" };
  }

  if (!urgent && isWithinQuietHours(new Date(), settings.quiet_start, settings.quiet_end)) {
    return { sent: false, skipped: true, reason: "quiet hours" };
  }

  if (dedupeKey && (await hasNotificationBeenSent(dedupeKey))) {
    return { sent: false, skipped: true, reason: "already sent" };
  }

  const result = await deliverWhatsApp(message);

  await recordNotification({
    kind,
    dedupeKey: dedupeKey || `${kind}_${Date.now()}`,
    refId,
    status: result.success ? "sent" : "failed",
    error: result.error,
  });

  return { sent: result.success, error: result.error };
}

/** Quiet hours wrap midnight, e.g. 22 -> 8. */
export function isWithinQuietHours(at: Date, quietStart: number, quietEnd: number): boolean {
  if (quietStart === quietEnd) return false;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(at)
  );
  return quietStart < quietEnd
    ? hour >= quietStart && hour < quietEnd
    : hour >= quietStart || hour < quietEnd;
}

// --- Recipient channel (Email) --------------------------------------------

export type EmailTemplate =
  | "MeetingInvite"
  | "MeetingReminder"
  | "MeetingUpdated"
  | "MeetingCancelled"
  | "TaskAssigned"
  | "TaskReminder"
  | "DeliverableNudge"
  | "WeeklyTeamDigest";

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface SendEmailOptions {
  subject: string;
  html: string;
  /** Required. Every template ships a plaintext alternative. */
  text: string;
  attachments?: EmailAttachment[];
  dedupeKey?: string;
  refId?: string;
  replyTo?: string;
}

export interface EmailResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  providerId?: string;
  error?: string;
}

export const isEmailEnabled = () =>
  process.env.EMAIL_ENABLED !== "false" && Boolean(process.env.RESEND_API_KEY);

/** Why email is unavailable, for the UI to display. Null when it is working. */
export function emailDisabledReason(): string | null {
  if (process.env.EMAIL_ENABLED === "false") return "EMAIL_ENABLED is set to false.";
  if (!process.env.RESEND_API_KEY) return "RESEND_API_KEY is not set.";
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (value: string) => EMAIL_RE.test(value.trim());

export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  options: SendEmailOptions
): Promise<EmailResult> {
  const recipients = (Array.isArray(to) ? to : [to])
    .map((r) => r.trim())
    .filter((r) => isValidEmail(r));

  if (recipients.length === 0) {
    return { sent: false, skipped: true, reason: "no valid recipient" };
  }

  if (options.dedupeKey && (await isEmailAlreadySent(options.dedupeKey))) {
    return { sent: false, skipped: true, reason: "already sent" };
  }

  const disabled = emailDisabledReason();
  if (disabled) {
    // Never fail silently and never crash: log the whole message instead.
    console.log("========== EMAIL (not sent: " + disabled + ") ==========");
    console.log("To:", recipients.join(", "));
    console.log("Template:", template);
    console.log("Subject:", options.subject);
    console.log(options.text);
    console.log("======================================================");
    await logEmail({
      toEmail: recipients.join(","),
      template,
      subject: options.subject,
      refId: options.refId,
      dedupeKey: options.dedupeKey,
      status: "skipped",
      error: disabled,
    });
    return { sent: false, skipped: true, reason: disabled };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || undefined,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content).toString("base64"),
        contentType: a.contentType,
      })),
    });

    if (error) {
      await logEmail({
        toEmail: recipients.join(","),
        template,
        subject: options.subject,
        refId: options.refId,
        dedupeKey: options.dedupeKey,
        status: "failed",
        error: error.message,
      });
      return { sent: false, error: error.message };
    }

    await logEmail({
      toEmail: recipients.join(","),
      template,
      subject: options.subject,
      refId: options.refId,
      dedupeKey: options.dedupeKey,
      status: "sent",
      providerId: data?.id,
    });
    return { sent: true, providerId: data?.id };
  } catch (e: any) {
    await logEmail({
      toEmail: recipients.join(","),
      template,
      subject: options.subject,
      refId: options.refId,
      dedupeKey: options.dedupeKey,
      status: "failed",
      error: e.message || String(e),
    });
    return { sent: false, error: e.message || String(e) };
  }
}
