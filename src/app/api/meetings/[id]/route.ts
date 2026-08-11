import { NextRequest, NextResponse } from "next/server";
import { getMeetingById, updateMeeting, deleteMeeting } from "@/lib/queries/meetings";
import { getContactById } from "@/lib/queries/contacts";
import { sendMeetingEmail } from "@/lib/email/meetingInvites";

/**
 * PATCH supports three intents:
 *   action: "resend"  — send the invite again, same sequence
 *   action: "cancel"  — mark cancelled and send METHOD:CANCEL
 *   (default)         — edit fields; when the time or link changes and
 *                       send_update is set, bump SEQUENCE and send an update
 *                       so calendars amend the existing entry.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await getMeetingById(id);
    if (!existing) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    const contact = existing.contact_id ? await getContactById(existing.contact_id) : null;

    if (body.action === "resend") {
      const result = await sendMeetingEmail("invite", existing as any, contact, {
        dedupeKey: `meeting_resend_${id}_${Date.now()}`,
      });
      if (result.sent) await updateMeeting(id, { invite_sent_at: new Date().toISOString() } as any);
      return NextResponse.json({ ...existing, invite: result });
    }

    if (body.action === "cancel") {
      const cancelled = await updateMeeting(id, { status: "cancelled" } as any);
      const result = await sendMeetingEmail("cancel", existing as any, contact, {
        dedupeKey: `meeting_cancel_${id}`,
      });
      return NextResponse.json({ ...cancelled, invite: result });
    }

    const fields: Record<string, any> = {};
    if (typeof body.title === "string" && body.title.trim()) fields.title = body.title.trim();
    if (body.starts_at) fields.starts_at = new Date(body.starts_at).toISOString();
    if (body.ends_at) fields.ends_at = new Date(body.ends_at).toISOString();
    if ("meeting_link" in body) fields.meeting_link = body.meeting_link?.trim() || null;
    if ("agenda" in body) fields.agenda = body.agenda?.trim() || null;
    if ("location_or_link" in body) fields.location_or_link = body.location_or_link?.trim() || null;
    if (body.status) fields.status = body.status;

    const start = fields.starts_at || existing.starts_at;
    const end = fields.ends_at || existing.ends_at;
    if (new Date(end) <= new Date(start)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Only a time or link change is material to an already-issued invite.
    const materialChange =
      (fields.starts_at && fields.starts_at !== existing.starts_at) ||
      (fields.ends_at && fields.ends_at !== existing.ends_at) ||
      ("meeting_link" in fields && fields.meeting_link !== existing.meeting_link);

    if (materialChange && body.send_update) {
      fields.invite_sequence = (existing.invite_sequence ?? 0) + 1;
    }

    const updated = await updateMeeting(id, fields as any);
    if (!updated) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

    let invite: any = { sent: false, skipped: true, reason: "no update requested" };
    if (materialChange && body.send_update) {
      invite = await sendMeetingEmail("update", updated as any, contact, {
        dedupeKey: `meeting_update_${id}_${updated.invite_sequence}`,
      });
    }

    return NextResponse.json({ ...updated, invite, materialChange });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const removed = await deleteMeeting(id);
    if (!removed) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete meeting" }, { status: 500 });
  }
}
