import { createEvent, EventAttributes, DateArray } from "ics";

export const IST_TZID = "Asia/Kolkata";

/**
 * ics expects a UTC date array when `startInputType` is "utc".
 * Months are 1-based; everything else matches the Date getters.
 */
function toUtcArray(date: Date): DateArray {
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ];
}

export interface CalendarInvite {
  /** Stable across updates so calendars amend rather than duplicate. */
  uid: string;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  location?: string;
  url?: string;
  organizerName: string;
  organizerEmail: string;
  attendees?: Array<{ name?: string; email: string }>;
  /** Increment on every edit. Calendars ignore a stale sequence. */
  sequence?: number;
  method?: "REQUEST" | "CANCEL";
  status?: "CONFIRMED" | "CANCELLED";
}

/**
 * Builds an .ics payload.
 *
 * Times are emitted in UTC. A calendar client resolves UTC to the viewer's own
 * zone, so an IST meeting shows correctly wherever the attendee is; TZID is
 * carried for clients that display the originating zone.
 */
export function buildIcs(invite: CalendarInvite): { value: string; filename: string } | null {
  const start = new Date(invite.startsAt);
  const end = new Date(invite.endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const attributes: EventAttributes = {
    uid: invite.uid,
    title: invite.title,
    start: toUtcArray(start),
    startInputType: "utc",
    end: toUtcArray(end),
    endInputType: "utc",
    description: invite.description || undefined,
    location: invite.location || undefined,
    url: invite.url || undefined,
    organizer: { name: invite.organizerName, email: invite.organizerEmail },
    attendees: invite.attendees?.map((a) => ({
      name: a.name || a.email,
      email: a.email,
      rsvp: true,
      partstat: "NEEDS-ACTION",
      role: "REQ-PARTICIPANT",
    })),
    sequence: invite.sequence ?? 0,
    status: invite.status || "CONFIRMED",
    productId: "sahoda-crm",
    calName: "Sahoda CRM",
  };

  const { error, value } = createEvent(attributes);
  if (error || !value) {
    console.error("[ics] generation failed:", error);
    return null;
  }

  // The ics package emits PUBLISH; REQUEST is what makes a mail client offer
  // "Add to calendar", and CANCEL is what removes the event.
  const method = invite.method || "REQUEST";
  let output = value.replace(/METHOD:PUBLISH/, `METHOD:${method}`);
  if (!output.includes("METHOD:")) {
    output = output.replace("BEGIN:VEVENT", `METHOD:${method}\r\nBEGIN:VEVENT`);
  }
  if (!output.includes("X-WR-TIMEZONE")) {
    output = output.replace("BEGIN:VEVENT", `X-WR-TIMEZONE:${IST_TZID}\r\nBEGIN:VEVENT`);
  }

  return { value: output, filename: "invite.ics" };
}

/** "Thursday, 4 September 2026 at 4:00 pm IST" */
export function formatIst(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TZID,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso)) + " IST"
  );
}

/** "4:00 pm IST" */
export function formatIstTime(iso: string): string {
  return (
    new Intl.DateTimeFormat("en-IN", {
      timeZone: IST_TZID,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso)) + " IST"
  );
}

export function durationLabel(startsAt: string, endsAt: string): string {
  const mins = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
  if (mins < 60) return `${mins} minutes`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : `${hours}h ${rest}m`;
}
