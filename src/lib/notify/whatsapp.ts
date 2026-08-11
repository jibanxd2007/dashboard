import { sendWhatsApp } from "./index";

export async function sendWhatsAppNotification(message: string, dedupeKey?: string) {
  return sendWhatsApp(message);
}
