import { notifyOwner } from "@/lib/notify/channels";

/**
 * @deprecated Use notifyOwner() from lib/notify/channels directly.
 * Kept so existing call sites keep working; it forwards to the owner channel
 * and, like notifyOwner, cannot address anyone else.
 */
export async function sendWhatsAppNotification(message: string, dedupeKey?: string) {
  return notifyOwner(message, { dedupeKey, kind: "new_lead", urgent: true });
}
