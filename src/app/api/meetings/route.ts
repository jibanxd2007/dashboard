import { NextRequest, NextResponse } from "next/server";
import { getMeetings, createMeeting } from "@/lib/queries/meetings";
import { getContactById } from "@/lib/queries/contacts";
import { logActivity } from "@/lib/queries/activities";
import { sendMeetingEmail } from "@/lib/email/meetingInvites";
import { MeetingMode } from "@/lib/database.types";
import { AttendeeReminder } from "@/lib/mockStore";

const MODES: MeetingMode[] = ["call", "video", "in_person"];
const REMINDERS: AttendeeReminder[] = ["none", "day", "hour", "both"];

export async function GET() {
  try {
    return NextResponse.json(await getMeetings());
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

    const additional: string[] = String(body.additional_recipients || "")
      .split(",")
      .map((e: string) => e.trim())
      .filter(Boolean);

    const meeting = await createMeeting({
      contact_id: body.contact_id || null,
      title: body.title.trim(),
      starts_at: new Date(body.starts_at).toISOString(),
      ends_at: new Date(body.ends_at).toISOString(),
      mode: MODES.includes(body.mode) ? body.mode : "video",
      location_or_link: body.location_or_link?.trim() || null,
      agenda: body.agenda?.trim() || null,
      status: "scheduled",
      remind_minutes_before: Number(body.remind_minutes_before) || 30,
      meeting_link: body.meeting_link?.trim() || null,
      additional_recipients: additional,
      invite_sent_at: null,
      invite_sequence: 0,
      attendee_reminder: REMINDERS.includes(body.attendee_reminder) ? body.attendee_reminder : "both",
    } as any);

    // Sending the invite is the explicit point of scheduling, so it goes out
    // without a further confirmation step.
    let invite: any = { sent: false, skipped: true, reason: "not requested" };
    if (body.send_invite !== false) {
      const contact = meeting.contact_id ? await getContactById(meeting.contact_id) : null;
      invite = await sendMeetingEmail("invite", meeting as any, contact, {
        dedupeKey: `meeting_invite_${meeting.id}_0`,
      });

      if (invite.sent) {
        const { updateMeeting } = await import("@/lib/queries/meetings");
        await updateMeeting(meeting.id, { invite_sent_at: new Date().toISOString() } as any);
        if (contact) {
          await logActivity(
            contact.id,
            "meeting",
            `Meeting invite emailed to ${contact.email} for "${meeting.title}".`
          );
        }
      }
    }

    return NextResponse.json({ ...meeting, invite }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create meeting" }, { status: 500 });
  }
}
