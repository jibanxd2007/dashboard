import { MeetingItem, ContactItem } from "@/lib/mockStore";
import { sendEmail, isValidEmail } from "@/lib/notify/channels";
import { buildIcs } from "@/lib/email/ics";
import {
  meetingInvite,
  meetingReminder,
  meetingUpdated,
  meetingCancelled,
  defaultSignature,
} from "@/lib/email/templates";

type InviteKind = "invite" | "update" | "cancel" | "reminder";

/**
 * Recipients for a meeting: the client plus any additional addresses.
 * Invalid entries are dropped rather than failing the whole send.
 */
export function meetingRecipients(meeting: any, contact: ContactItem | null): string[] {
  const list: string[] = [];
  if (contact?.email && isValidEmail(contact.email)) list.push(contact.email);
  for (const extra of meeting.additional_recipients || []) {
    if (isValidEmail(extra) && !list.includes(extra.trim())) list.push(extra.trim());
  }
  return list;
}

export async function sendMeetingEmail(
  kind: InviteKind,
  meeting: MeetingItem & {
    meeting_link?: string | null;
    additional_recipients?: string[];
    invite_sequence?: number;
  },
  contact: ContactItem | null,
  options: { leadIn?: string; dedupeKey?: string } = {}
) {
  const recipients = meetingRecipients(meeting, contact);
  if (recipients.length === 0) {
    return { sent: false, skipped: true, reason: "no valid recipient email" };
  }

  const signature = await defaultSignature();
  const link = meeting.meeting_link || meeting.location_or_link || null;

  const shared = {
    recipientName: contact?.full_name,
    title: meeting.title,
    startsAt: meeting.starts_at,
    endsAt: meeting.ends_at,
    meetingLink: link,
    location: meeting.location_or_link,
    agenda: meeting.agenda,
    signature,
  };

  const rendered =
    kind === "invite"
      ? meetingInvite(shared)
      : kind === "update"
        ? meetingUpdated(shared)
        : kind === "cancel"
          ? meetingCancelled(shared)
          : meetingReminder({ ...shared, leadIn: options.leadIn || "Starting soon" });

  // A stable UID means updates amend the existing calendar entry; a bumped
  // SEQUENCE is what tells the calendar this version is newer.
  const ics = buildIcs({
    uid: `meeting-${meeting.id}@sahoda-crm`,
    title: meeting.title,
    startsAt: meeting.starts_at,
    endsAt: meeting.ends_at,
    description: meeting.agenda || undefined,
    location: link || undefined,
    url: link || undefined,
    organizerName: signature.name,
    organizerEmail: process.env.OWNER_EMAIL || process.env.EMAIL_REPLY_TO || "no-reply@sahoda.local",
    attendees: recipients.map((email) => ({ email })),
    sequence: meeting.invite_sequence ?? 0,
    method: kind === "cancel" ? "CANCEL" : "REQUEST",
    status: kind === "cancel" ? "CANCELLED" : "CONFIRMED",
  });

  const template =
    kind === "invite"
      ? "MeetingInvite"
      : kind === "update"
        ? "MeetingUpdated"
        : kind === "cancel"
          ? "MeetingCancelled"
          : "MeetingReminder";

  return sendEmail(recipients, template as any, {
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    refId: meeting.id,
    dedupeKey: options.dedupeKey,
    attachments: ics
      ? [
          {
            filename: ics.filename,
            content: ics.value,
            contentType: `text/calendar; charset=utf-8; method=${kind === "cancel" ? "CANCEL" : "REQUEST"}`,
          },
        ]
      : undefined,
  });
}
