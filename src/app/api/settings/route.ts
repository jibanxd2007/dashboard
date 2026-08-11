import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/queries/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update settings" }, { status: 500 });
  }
}
