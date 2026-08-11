import { NextRequest, NextResponse } from "next/server";
import { getTeamMeetings, createTeamMeeting } from "@/lib/queries/team";
import { MeetingMode } from "@/lib/database.types";

const MODES: MeetingMode[] = ["call", "video", "in_person"];

export async function GET() {
  try {
    return NextResponse.json(await getTeamMeetings());
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load meetings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.starts_at || !body.ends_at) {
      return NextResponse.json(
        { error: "Title, start time and end time are required" },
        { status: 400 }
      );
    }

    if (new Date(body.ends_at) <= new Date(body.starts_at)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const meeting = await createTeamMeeting({
      title: body.title.trim(),
      starts_at: new Date(body.starts_at).toISOString(),
      ends_at: new Date(body.ends_at).toISOString(),
      mode: MODES.includes(body.mode) ? body.mode : "video",
      location_or_link: body.location_or_link?.trim() || null,
      agenda: body.agenda?.trim() || null,
      status: "scheduled",
      attendee_ids: Array.isArray(body.attendee_ids) ? body.attendee_ids : [],
      remind_minutes_before: Number(body.remind_minutes_before) || 30,
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to schedule meeting" }, { status: 500 });
  }
}
