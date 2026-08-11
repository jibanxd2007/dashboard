import { NextRequest, NextResponse } from "next/server";
import { getMeetings, createMeeting } from "@/lib/queries/meetings";

export async function GET() {
  const meetings = await getMeetings();
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.starts_at || !body.ends_at) {
      return NextResponse.json({ error: "Title, start time, and end time are required" }, { status: 400 });
    }

    const meeting = await createMeeting({
      contact_id: body.contact_id || null,
      title: body.title,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      mode: body.mode || "video",
      location_or_link: body.location_or_link || null,
      agenda: body.agenda || null,
      status: "scheduled",
      remind_minutes_before: Number(body.remind_minutes_before) || 30,
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create meeting" }, { status: 500 });
  }
}
