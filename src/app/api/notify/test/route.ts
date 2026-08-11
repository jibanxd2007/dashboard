import { NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/notify";

export async function POST() {
  try {
    const testMsg = `🔔 *SoloCRM WhatsApp Test Notification*\n\nYour WhatsApp notification integration is active and working properly!`;
    const result = await sendWhatsApp(testMsg);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to send test notification" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
