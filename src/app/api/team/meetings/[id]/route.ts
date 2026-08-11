import { NextRequest, NextResponse } from "next/server";
import { updateTeamMeeting, deleteTeamMeeting } from "@/lib/queries/team";
import { MeetingMode, MeetingStatus } from "@/lib/database.types";

const MODES: MeetingMode[] = ["call", "video", "in_person"];
const STATUSES: MeetingStatus[] = ["scheduled", "completed", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const fields: Record<string, any> = {};
    if (typeof body.title === "string" && body.title.trim()) fields.title = body.title.trim();
    if (body.starts_at) fields.starts_at = new Date(body.starts_at).toISOString();
    if (body.ends_at) fields.ends_at = new Date(body.ends_at).toISOString();
    if (MODES.includes(body.mode)) fields.mode = body.mode;
    if (STATUSES.includes(body.status)) fields.status = body.status;
    if ("location_or_link" in body) fields.location_or_link = body.location_or_link?.trim() || null;
    if ("agenda" in body) fields.agenda = body.agenda?.trim() || null;
    if (Array.isArray(body.attendee_ids)) fields.attendee_ids = body.attendee_ids;

    if (fields.starts_at && fields.ends_at && new Date(fields.ends_at) <= new Date(fields.starts_at)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateTeamMeeting(id, fields);
    if (!updated) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removed = await deleteTeamMeeting(id);
    if (!removed) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete meeting" }, { status: 500 });
  }
}
