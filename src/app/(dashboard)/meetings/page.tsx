"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Video,
  Phone,
  MapPin,
  Clock,
  User,
  ExternalLink,
  X,
  CheckCircle2,
  MailCheck,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { MeetingItem, ContactItem, AttendeeReminder } from "@/lib/mockStore";
import { MeetingMode } from "@/lib/database.types";

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSlot() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 30 * 60000);
  return { starts_at: toLocalInput(start), ends_at: toLocalInput(end) };
}

const emptyForm = () => ({
  title: "",
  contact_id: "",
  ...defaultSlot(),
  mode: "video" as MeetingMode,
  meeting_link: "",
  location_or_link: "",
  agenda: "",
  additional_recipients: "",
  attendee_reminder: "both" as AttendeeReminder,
  send_invite: true,
  remind_minutes_before: 30,
});

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [meetingForm, setMeetingForm] = useState(emptyForm);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([fetch("/api/meetings"), fetch("/api/contacts")]);
      if (mRes.ok) setMeetings(await mRes.json());
      if (cRes.ok) setContacts(await cRes.json());
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setErrors({});
    openerRef.current?.focus();
  }, []);

  // Escape closes the dialog and returns focus to the button that opened it.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isModalOpen, saving, closeModal]);

  const openModal = () => {
    setMeetingForm(emptyForm());
    setErrors({});
    setIsModalOpen(true);
  };

  function validate(form: ReturnType<typeof emptyForm>) {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Give the meeting a title.";
    if (!form.starts_at) next.starts_at = "Pick a start time.";
    if (!form.ends_at) next.ends_at = "Pick an end time.";
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      next.ends_at = "End time must be after the start time.";
    }
    const bad = form.additional_recipients
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad.length) next.additional_recipients = `Not a valid email: ${bad[0]}`;

    const contact = contacts.find((c) => c.id === form.contact_id);
    if (form.send_invite && !contact?.email && bad.length === 0) {
      const extras = form.additional_recipients.trim();
      if (!extras) next.send_invite = "Nobody to email — this contact has no address.";
    }
    return next;
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return; // guard against double submit

    const found = validate(meetingForm);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingForm),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to schedule meeting");
        return;
      }

      // The meeting is saved either way; the invite is reported separately so a
      // failed email never reads as a failed save.
      if (meetingForm.send_invite) {
        if (data.invite?.sent) {
          toast.success("Meeting scheduled and invite emailed.");
        } else if (data.invite?.skipped) {
          toast.warning(`Meeting saved. Invite not sent: ${data.invite.reason}`);
        } else {
          toast.warning(`Meeting saved, but the invite failed: ${data.invite?.error || "unknown error"}`);
        }
      } else {
        toast.success("Meeting scheduled.");
      }

      closeModal();
      fetchData();
    } catch {
      toast.error("Could not reach the server. Your meeting was not saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (meeting: MeetingItem) => {
    if (resendingId) return;
    setResendingId(meeting.id);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      const data = await res.json();
      if (res.ok && data.invite?.sent) {
        toast.success("Invite sent again.");
        fetchData();
      } else {
        toast.error(data.invite?.error || data.invite?.reason || "Could not resend the invite.");
      }
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setResendingId(null);
    }
  };

  const now = new Date();
  const upcomingMeetings = meetings.filter(
    (m) => new Date(m.ends_at) >= now && m.status !== "cancelled"
  );
  const pastMeetings = meetings.filter(
    (m) => new Date(m.ends_at) < now || m.status === "completed"
  );

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border-primary)",
    color: "var(--text-primary)",
  };
  const errStyle = { ...inputStyle, border: "1px solid #ef4444" };
  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
        {errors[key]}
      </p>
    ) : null;

  const selectedContact = contacts.find((c) => c.id === meetingForm.contact_id);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Meetings &amp; Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Schedule calls and email the invite in one step.
          </p>
        </div>
        <button
          ref={openerRef}
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--bg-hover)" }} />
              <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: "var(--bg-hover)" }} />
              <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: "var(--bg-hover)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2
              className="text-base font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <CalendarIcon className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Upcoming (
              {upcomingMeetings.length})
            </h2>

            {upcomingMeetings.length === 0 ? (
              <div className="card p-8 text-center space-y-3">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No upcoming meetings.
                </p>
                <button
                  onClick={openModal}
                  className="text-xs font-semibold px-3.5 py-2 rounded-lg min-h-[44px]"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  Schedule your first meeting
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.map((m) => {
                  const contact = contacts.find((c) => c.id === m.contact_id);
                  const link = m.meeting_link || m.location_or_link;
                  return (
                    <div key={m.id} className="card p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-mono font-medium flex items-center gap-1"
                            style={{ color: "var(--accent-text)" }}
                            title={new Date(m.starts_at).toString()}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(m.starts_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span
                            className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                            style={{
                              background:
                                m.mode === "video"
                                  ? "var(--purple-light)"
                                  : m.mode === "call"
                                    ? "var(--indigo-light)"
                                    : "var(--amber-light)",
                              color:
                                m.mode === "video"
                                  ? "var(--purple)"
                                  : m.mode === "call"
                                    ? "var(--indigo)"
                                    : "var(--amber)",
                            }}
                          >
                            {m.mode === "video" ? (
                              <Video className="w-3 h-3" />
                            ) : m.mode === "call" ? (
                              <Phone className="w-3 h-3" />
                            ) : (
                              <MapPin className="w-3 h-3" />
                            )}
                            {m.mode}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {m.title}
                        </h3>

                        {contact && (
                          <p
                            className="text-xs flex items-center gap-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <User className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            <span>{contact.full_name}</span>
                          </p>
                        )}

                        {m.invite_sent_at ? (
                          <p
                            className="text-[11px] flex items-center gap-1"
                            style={{ color: "var(--text-muted)" }}
                            title={new Date(m.invite_sent_at).toString()}
                          >
                            <MailCheck className="w-3.5 h-3.5" style={{ color: "#22c55e" }} />
                            Invite sent {new Date(m.invite_sent_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            No invite sent
                          </p>
                        )}

                        {m.agenda && (
                          <p
                            className="text-xs p-2 rounded-lg border line-clamp-2"
                            style={{
                              background: "var(--bg-secondary)",
                              borderColor: "var(--border-secondary)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {m.agenda}
                          </p>
                        )}
                      </div>

                      <div
                        className="flex items-center justify-between gap-2 pt-2 border-t"
                        style={{ borderColor: "var(--border-secondary)" }}
                      >
                        {link && link.startsWith("http") ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                            style={{ color: "var(--accent-text)" }}
                          >
                            Join <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                            {link || ""}
                          </span>
                        )}

                        <button
                          onClick={() => handleResend(m)}
                          disabled={resendingId === m.id || !contact?.email}
                          title={
                            !contact?.email
                              ? "This contact has no email address"
                              : "Send the invite again"
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                        >
                          {resendingId === m.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" /> Sending
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" /> Resend
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {pastMeetings.length > 0 && (
            <div className="space-y-3">
              <h2
                className="text-sm font-semibold flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> Past (
                {pastMeetings.length})
              </h2>
              <div className="card overflow-hidden">
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  {pastMeetings.slice(0, 50).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 flex items-center justify-between text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {m.title}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: "var(--text-muted)" }}
                        title={new Date(m.starts_at).toString()}
                      >
                        {new Date(m.starts_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
                {pastMeetings.length > 50 && (
                  <div
                    className="p-2 text-center text-[11px]"
                    style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}
                  >
                    Showing the 50 most recent of {pastMeetings.length}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--bg-modal-overlay)" }}
          onClick={() => !saving && closeModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Schedule meeting"
            className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-primary)",
              boxShadow: "var(--shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Schedule Meeting
              </h3>
              <button
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-sm" noValidate>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  onBlur={() => setErrors(validate(meetingForm))}
                  placeholder="Discovery call"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={errors.title ? errStyle : inputStyle}
                />
                {fieldError("title")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Contact
                  </label>
                  <select
                    value={meetingForm.contact_id}
                    onChange={(e) => setMeetingForm({ ...meetingForm, contact_id: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">None (internal)</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                        {c.email ? "" : " (no email)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Mode
                  </label>
                  <select
                    value={meetingForm.mode}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, mode: e.target.value as MeetingMode })
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="video">Google Meet / Video</option>
                    <option value="call">Phone Call</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Starts At * <span style={{ color: "var(--text-muted)" }}>(IST)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingForm.starts_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, starts_at: e.target.value })}
                    onBlur={() => setErrors(validate(meetingForm))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={errors.starts_at ? errStyle : inputStyle}
                  />
                  {fieldError("starts_at")}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Ends At * <span style={{ color: "var(--text-muted)" }}>(IST)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingForm.ends_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, ends_at: e.target.value })}
                    onBlur={() => setErrors(validate(meetingForm))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={errors.ends_at ? errStyle : inputStyle}
                  />
                  {fieldError("ends_at")}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={meetingForm.meeting_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })}
                  placeholder="https://meet.google.com/... — paste your own"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div
                className="rounded-lg p-3 space-y-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meetingForm.send_invite}
                    onChange={(e) => {
                      const next = { ...meetingForm, send_invite: e.target.checked };
                      setMeetingForm(next);
                      setErrors(validate(next));
                    }}
                    className="mt-0.5 w-4 h-4 shrink-0"
                  />
                  <span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      Send invite email
                    </span>
                    <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {selectedContact?.email
                        ? `Emails ${selectedContact.email} with a calendar attachment.`
                        : "Includes a calendar attachment they can add in one tap."}
                    </span>
                  </span>
                </label>
                {fieldError("send_invite")}

                {meetingForm.send_invite && (
                  <>
                    <div>
                      <label
                        className="block text-[11px] font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Additional recipients
                      </label>
                      <input
                        type="text"
                        value={meetingForm.additional_recipients}
                        onChange={(e) =>
                          setMeetingForm({ ...meetingForm, additional_recipients: e.target.value })
                        }
                        onBlur={() => setErrors(validate(meetingForm))}
                        placeholder="teammate@example.com, other@example.com"
                        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                        style={errors.additional_recipients ? errStyle : inputStyle}
                      />
                      {fieldError("additional_recipients")}
                    </div>

                    <div>
                      <label
                        className="block text-[11px] font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Reminder to attendee
                      </label>
                      <select
                        value={meetingForm.attendee_reminder}
                        onChange={(e) =>
                          setMeetingForm({
                            ...meetingForm,
                            attendee_reminder: e.target.value as AttendeeReminder,
                          })
                        }
                        className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                        style={inputStyle}
                      >
                        <option value="both">1 day and 1 hour before</option>
                        <option value="day">1 day before</option>
                        <option value="hour">1 hour before</option>
                        <option value="none">No reminder</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Agenda
                </label>
                <textarea
                  rows={3}
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div
                className="pt-3 border-t flex items-center justify-end gap-2"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-medium min-h-[44px] disabled:opacity-50"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-medium min-h-[44px] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving
                    ? meetingForm.send_invite
                      ? "Saving and sending..."
                      : "Saving..."
                    : "Save Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
