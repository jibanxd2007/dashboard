import { NextRequest, NextResponse } from "next/server";
import { buildIcs, formatIst } from "@/lib/email/ics";
import { meetingInvite, defaultSignature } from "@/lib/email/templates";
import { emailDisabledReason } from "@/lib/notify/channels";

/**
 * Renders an email without sending it. Backs the agent's send-confirmation
 * card and the reminder preview, and is how the .ics output can be inspected.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = await defaultSignature();

    const startsAt = body.starts_at || new Date(Date.now() + 86400000).toISOString();
    const endsAt = body.ends_at || new Date(Date.now() + 86400000 + 1800000).toISOString();

    const rendered = meetingInvite({
      recipientName: body.recipient_name,
      title: body.title || "Untitled meeting",
      startsAt,
      endsAt,
      meetingLink: body.meeting_link || null,
      agenda: body.agenda || null,
      signature,
    });

    const ics = buildIcs({
      uid: `meeting-${body.id || "preview"}@sahoda-crm`,
      title: body.title || "Untitled meeting",
      startsAt,
      endsAt,
      description: body.agenda || undefined,
      location: body.meeting_link || undefined,
      url: body.meeting_link || undefined,
      organizerName: signature.name,
      organizerEmail: process.env.OWNER_EMAIL || "no-reply@sahoda.local",
      attendees: body.to ? [{ email: body.to }] : undefined,
      sequence: body.sequence ?? 0,
      method: body.method || "REQUEST",
      status: body.method === "CANCEL" ? "CANCELLED" : "CONFIRMED",
    });

    return NextResponse.json({
      emailEnabled: emailDisabledReason() === null,
      emailDisabledReason: emailDisabledReason(),
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      istLabel: formatIst(startsAt),
      ics: ics?.value ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Preview failed" }, { status: 500 });
  }
}
