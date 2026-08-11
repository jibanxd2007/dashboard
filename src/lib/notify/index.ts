/**
 * @deprecated This module is now a thin shim over lib/notify/channels.
 *
 * The WhatsApp transport used to live here and took its recipient from
 * settings, which meant any caller could in principle address someone other
 * than the owner. Delivery now happens only inside channels.ts, where
 * notifyOwner() has no recipient parameter at all.
 *
 * New code should import notifyOwner / sendEmail from lib/notify/channels.
 */
import { NotificationKind } from "@/lib/database.types";
import { notifyOwner } from "@/lib/notify/channels";

export { notifyOwner, sendEmail, isEmailEnabled, emailDisabledReason } from "@/lib/notify/channels";

/** @deprecated Use notifyOwner(). */
export async function notify(
  kind: NotificationKind,
  dedupeKey: string,
  message: string,
  refId?: string
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  return notifyOwner(message, {
    kind,
    dedupeKey,
    refId,
    urgent: kind === "new_lead",
  });
}
