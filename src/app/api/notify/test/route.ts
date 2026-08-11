import { NextResponse } from "next/server";
import { notifyOwner } from "@/lib/notify/channels";

export async function POST() {
  try {
    const result = await notifyOwner(
      "🔔 *Sahoda CRM test alert*\n\nYour WhatsApp notifications are configured correctly.",
      // A test must send even at night, and must not be swallowed as a duplicate.
      { urgent: true, kind: "daily_digest", dedupeKey: `whatsapp_test_${Date.now()}` }
    );
    return NextResponse.json({ success: result.sent, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send test notification" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
