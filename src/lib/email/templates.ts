import { formatIst, formatIstTime, durationLabel } from "@/lib/email/ics";

/**
 * Templates are built as inline-styled HTML strings rather than rendered React.
 * Every mail client strips <style> blocks, so inline styles are what actually
 * survives; keeping them as strings also lets the reminder preview and the
 * agent's send-confirmation card show exactly what will go out.
 *
 * House style: white background, one accent rule, no imagery, no gradients,
 * no tracking pixels. Under 600px, readable on a phone.
 */

const ACCENT = "#FF4B00";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export interface Signature {
  name: string;
  business: string;
  phone?: string;
  replyTo?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function shell(bodyHtml: string, signature: Signature): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F9FAFB;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${BORDER};border-radius:12px;">
<tr><td style="height:3px;background:${ACCENT};border-radius:12px 12px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};font-size:15px;line-height:1.6;">
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${BORDER};padding-top:16px;color:${MUTED};font-size:13px;line-height:1.5;">
${escapeHtml(signature.name)}<br/>${escapeHtml(signature.business)}
${signature.phone ? `<br/>${escapeHtml(signature.phone)}` : ""}
${signature.replyTo ? `<br/><a href="mailto:${escapeHtml(signature.replyTo)}" style="color:${MUTED};">${escapeHtml(signature.replyTo)}</a>` : ""}
</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr>
<td style="background:${ACCENT};border-radius:8px;">
<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">${escapeHtml(label)}</a>
</td></tr></table>`;

const detailRow = (label: string, value: string) =>
  `<tr>
<td style="padding:6px 0;color:${MUTED};font-size:13px;width:96px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:6px 0;color:${INK};font-size:14px;font-weight:500;">${escapeHtml(value)}</td>
</tr>`;

const sigText = (s: Signature) =>
  `\n\n--\n${s.name}\n${s.business}${s.phone ? `\n${s.phone}` : ""}${s.replyTo ? `\n${s.replyTo}` : ""}`;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface MeetingEmailProps {
  recipientName?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingLink?: string | null;
  location?: string | null;
  agenda?: string | null;
  signature: Signature;
}

export function meetingInvite(p: MeetingEmailProps): RenderedEmail {
  const when = formatIst(p.startsAt);
  const dur = durationLabel(p.startsAt, p.endsAt);
  const where = p.meetingLink || p.location || null;

  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Meeting invitation</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
${p.recipientName ? `<p style="margin:0 0 16px;">Hi ${escapeHtml(p.recipientName)},</p>` : ""}
<p style="margin:0 0 4px;">Here are the details:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;">
${detailRow("When", when)}
${detailRow("Duration", dur)}
${where && !p.meetingLink ? detailRow("Where", where) : ""}
</table>
${p.meetingLink ? button(p.meetingLink, "Join the meeting") : ""}
${p.agenda ? `<p style="margin:16px 0 4px;color:${MUTED};font-size:13px;">Agenda</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(p.agenda)}</p>` : ""}
<p style="margin:20px 0 0;color:${MUTED};font-size:13px;">The attached invite adds this to your calendar in one tap.</p>`,
    p.signature
  );

  const text = `${p.title}
${p.recipientName ? `\nHi ${p.recipientName},\n` : ""}
When: ${when}
Duration: ${dur}${where ? `\nWhere: ${where}` : ""}${p.agenda ? `\n\nAgenda:\n${p.agenda}` : ""}

The attached invite adds this to your calendar.${sigText(p.signature)}`;

  return { subject: `Invitation: ${p.title} — ${when}`, html, text };
}

export function meetingReminder(p: MeetingEmailProps & { leadIn: string }): RenderedEmail {
  const time = formatIstTime(p.startsAt);
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Reminder</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 8px;">${escapeHtml(p.leadIn)} at <strong>${escapeHtml(time)}</strong>.</p>
${p.meetingLink ? button(p.meetingLink, "Join the meeting") : ""}
${p.agenda ? `<p style="margin:16px 0 4px;color:${MUTED};font-size:13px;">Agenda</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(p.agenda)}</p>` : ""}`,
    p.signature
  );

  const text = `${p.title}\n\n${p.leadIn} at ${time}.${p.meetingLink ? `\n\nJoin: ${p.meetingLink}` : ""}${p.agenda ? `\n\nAgenda:\n${p.agenda}` : ""}${sigText(p.signature)}`;
  return { subject: `${time} — ${p.title}`, html, text };
}

export function meetingUpdated(p: MeetingEmailProps): RenderedEmail {
  const when = formatIst(p.startsAt);
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${ACCENT};font-weight:600;">Updated</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 12px;">This meeting has been rescheduled. The new details:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;">
${detailRow("When", when)}
${detailRow("Duration", durationLabel(p.startsAt, p.endsAt))}
</table>
${p.meetingLink ? button(p.meetingLink, "Join the meeting") : ""}
<p style="margin:20px 0 0;color:${MUTED};font-size:13px;">Your calendar entry updates automatically from the attachment.</p>`,
    p.signature
  );
  const text = `Updated: ${p.title}\n\nNew time: ${when}${p.meetingLink ? `\nJoin: ${p.meetingLink}` : ""}\n\nYour calendar entry updates from the attachment.${sigText(p.signature)}`;
  return { subject: `Updated: ${p.title} — now ${when}`, html, text };
}

export function meetingCancelled(p: Omit<MeetingEmailProps, "endsAt"> & { endsAt: string }): RenderedEmail {
  const when = formatIst(p.startsAt);
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Cancelled</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 12px;">The meeting scheduled for <strong>${escapeHtml(when)}</strong> has been cancelled and removed from your calendar.</p>
<p style="margin:0;color:${MUTED};font-size:13px;">Apologies for the change — reply here to find another time.</p>`,
    p.signature
  );
  const text = `Cancelled: ${p.title}\n\nThe meeting on ${when} has been cancelled.\n\nReply to find another time.${sigText(p.signature)}`;
  return { subject: `Cancelled: ${p.title} — ${when}`, html, text };
}

export interface TaskEmailProps {
  assigneeName: string;
  title: string;
  clientName?: string | null;
  dueAt?: string | null;
  description?: string | null;
  signature: Signature;
}

export function taskAssigned(p: TaskEmailProps): RenderedEmail {
  const due = p.dueAt ? formatIst(p.dueAt) : "No due date";
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${MUTED};">New task assigned to you</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 12px;">Hi ${escapeHtml(p.assigneeName)},</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;">
${p.clientName ? detailRow("Client", p.clientName) : ""}
${detailRow("Due", due)}
</table>
${p.description ? `<p style="margin:16px 0 4px;color:${MUTED};font-size:13px;">Context</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(p.description)}</p>` : ""}`,
    p.signature
  );
  const text = `New task: ${p.title}\n\nHi ${p.assigneeName},\n${p.clientName ? `\nClient: ${p.clientName}` : ""}\nDue: ${due}${p.description ? `\n\nContext:\n${p.description}` : ""}${sigText(p.signature)}`;
  return { subject: `Task assigned: ${p.title}`, html, text };
}

export function taskReminder(p: TaskEmailProps & { variant: "tomorrow" | "today" | "overdue" }): RenderedEmail {
  const lead =
    p.variant === "overdue" ? "is overdue" : p.variant === "today" ? "is due today" : "is due tomorrow";
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${p.variant === "overdue" ? ACCENT : MUTED};font-weight:600;">${escapeHtml(p.variant === "overdue" ? "Overdue" : "Reminder")}</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 12px;">Hi ${escapeHtml(p.assigneeName)}, this task ${escapeHtml(lead)}.</p>
${p.clientName ? `<p style="margin:0;color:${MUTED};font-size:13px;">Client: ${escapeHtml(p.clientName)}</p>` : ""}`,
    p.signature
  );
  const text = `${p.title}\n\nHi ${p.assigneeName}, this task ${lead}.${p.clientName ? `\nClient: ${p.clientName}` : ""}${sigText(p.signature)}`;
  return {
    subject: p.variant === "overdue" ? `Overdue: ${p.title}` : `Due ${p.variant}: ${p.title}`,
    html,
    text,
  };
}

export interface DeliverableEmailProps {
  ownerName: string;
  title: string;
  clientName: string;
  dueAt: string | null;
  hoursUntilDue: number | null;
  signature: Signature;
}

export function deliverableNudge(p: DeliverableEmailProps): RenderedEmail {
  const overdue = p.hoursUntilDue !== null && p.hoursUntilDue < 0;
  const when = p.dueAt ? formatIst(p.dueAt) : "No due date";
  const lead = overdue
    ? `is overdue by ${Math.abs(Math.round(p.hoursUntilDue! / 24))} day(s)`
    : p.hoursUntilDue !== null && p.hoursUntilDue <= 1
      ? "is due now"
      : `is due in ${Math.round((p.hoursUntilDue || 0) / 24) || 1} day(s)`;

  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${overdue ? ACCENT : MUTED};font-weight:600;">${escapeHtml(overdue ? "Overdue deliverable" : "Deliverable due soon")}</p>
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">${escapeHtml(p.title)}</h1>
<p style="margin:0 0 12px;">Hi ${escapeHtml(p.ownerName)}, this deliverable ${escapeHtml(lead)}.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;">
${detailRow("Client", p.clientName)}
${detailRow("Due", when)}
</table>`,
    p.signature
  );
  const text = `${p.title}\n\nHi ${p.ownerName}, this deliverable ${lead}.\n\nClient: ${p.clientName}\nDue: ${when}${sigText(p.signature)}`;
  return { subject: `${overdue ? "Overdue" : "Due soon"}: ${p.title} (${p.clientName})`, html, text };
}

export interface DigestLine {
  label: string;
  detail: string;
}

export function weeklyTeamDigest(p: {
  memberName: string;
  tasks: DigestLine[];
  deliverables: DigestLine[];
  meetings: DigestLine[];
  signature: Signature;
}): RenderedEmail {
  const section = (heading: string, rows: DigestLine[]) =>
    rows.length === 0
      ? ""
      : `<p style="margin:20px 0 6px;font-size:13px;color:${MUTED};font-weight:600;">${escapeHtml(heading)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${rows
  .map(
    (r) =>
      `<tr><td style="padding:6px 0;border-bottom:1px solid ${BORDER};">
<span style="color:${INK};font-size:14px;font-weight:500;">${escapeHtml(r.label)}</span><br/>
<span style="color:${MUTED};font-size:13px;">${escapeHtml(r.detail)}</span></td></tr>`
  )
  .join("")}
</table>`;

  const total = p.tasks.length + p.deliverables.length + p.meetings.length;
  const html = shell(
    `<p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Your week</p>
<h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;font-weight:700;color:${INK};">Hi ${escapeHtml(p.memberName)}</h1>
<p style="margin:0;">${total === 0 ? "Nothing is assigned to you this week." : `You have ${total} item${total === 1 ? "" : "s"} this week.`}</p>
${section("Deliverables", p.deliverables)}
${section("Tasks", p.tasks)}
${section("Meetings", p.meetings)}`,
    p.signature
  );

  const plain = (heading: string, rows: DigestLine[]) =>
    rows.length === 0 ? "" : `\n\n${heading}\n${rows.map((r) => `- ${r.label} (${r.detail})`).join("\n")}`;

  const text = `Hi ${p.memberName}\n\n${total === 0 ? "Nothing assigned this week." : `${total} item(s) this week.`}${plain("Deliverables", p.deliverables)}${plain("Tasks", p.tasks)}${plain("Meetings", p.meetings)}${sigText(p.signature)}`;

  return { subject: `Your week — ${total} item${total === 1 ? "" : "s"}`, html, text };
}

export async function defaultSignature(): Promise<Signature> {
  return {
    name: process.env.OWNER_NAME || "Karunesh",
    business: process.env.BUSINESS_NAME || "Sahoda Labs",
    phone: process.env.CALLMEBOT_PHONE || undefined,
    replyTo: process.env.EMAIL_REPLY_TO || process.env.OWNER_EMAIL || undefined,
  };
}
