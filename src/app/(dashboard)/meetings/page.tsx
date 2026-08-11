"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { MeetingItem, ContactItem } from "@/lib/mockStore";
import { MeetingMode } from "@/lib/database.types";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [meetingForm, setMeetingForm] = useState({
    title: "",
    contact_id: "",
    starts_at: "",
    ends_at: "",
    mode: "video" as MeetingMode,
    location_or_link: "",
    agenda: "",
    remind_minutes_before: 30,
  });

  const fetchData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/contacts"),
      ]);
      const mData = await mRes.json();
      const cData = await cRes.json();
      setMeetings(mData);
      setContacts(cData);
    } catch (e) {
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.starts_at || !meetingForm.ends_at) {
      toast.error("Title, start time, and end time are required");
      return;
    }

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingForm),
      });

      if (res.ok) {
        toast.success("Meeting scheduled!");
        setIsModalOpen(false);
        setMeetingForm({
          title: "",
          contact_id: "",
          starts_at: "",
          ends_at: "",
          mode: "video",
          location_or_link: "",
          agenda: "",
          remind_minutes_before: 30,
        });
        fetchData();
      } else {
        toast.error("Failed to schedule meeting");
      }
    } catch (e) {
      toast.error("Error creating meeting");
    }
  };

  const now = new Date();
  const upcomingMeetings = meetings.filter((m) => new Date(m.ends_at) >= now && m.status !== "cancelled");
  const pastMeetings = meetings.filter((m) => new Date(m.ends_at) < now || m.status === "completed");

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Meetings & Calendar</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Schedule discovery calls and client check-ins.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading meetings...</div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <CalendarIcon className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Upcoming Meetings ({upcomingMeetings.length})
            </h2>

            {upcomingMeetings.length === 0 ? (
              <div className="card p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No upcoming meetings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.map((m) => {
                  const contact = contacts.find((c) => c.id === m.contact_id);
                  return (
                    <div key={m.id} className="card p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-medium flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(m.starts_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span
                            className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                            style={{
                              background: m.mode === "video" ? "var(--purple-light)" : m.mode === "call" ? "var(--indigo-light)" : "var(--amber-light)",
                              color: m.mode === "video" ? "var(--purple)" : m.mode === "call" ? "var(--indigo)" : "var(--amber)",
                            }}
                          >
                            {m.mode === "video" ? <Video className="w-3 h-3" /> : m.mode === "call" ? <Phone className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {m.mode}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</h3>

                        {contact && (
                          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                            <User className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                            <span>{contact.full_name}</span>
                            {contact.company && <span style={{ color: "var(--text-muted)" }}>({contact.company})</span>}
                          </p>
                        )}

                        {m.agenda && (
                          <p className="text-xs p-2 rounded.lg border line-clamp-2" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}>
                            {m.agenda}
                          </p>
                        )}
                      </div>

                      {m.location_or_link && (
                        <div className="pt-2 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                          {m.location_or_link.startsWith("http") ? (
                            <a
                              href={m.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "var(--accent-text)" }}
                            >
                              Join Call <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.location_or_link}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> Past Meetings ({pastMeetings.length})
              </h2>

              <div className="card overflow-hidden">
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  {pastMeetings.map((m) => {
                    const contact = contacts.find((c) => c.id === m.contact_id);
                    return (
                      <div key={m.id} className="p-3 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                        <div>
                          <span className="font-medium block" style={{ color: "var(--text-primary)" }}>{m.title}</span>
                          {contact && <span style={{ color: "var(--text-muted)" }}>With: {contact.full_name}</span>}
                        </div>
                        <div className="text-right font-mono" style={{ color: "var(--text-muted)" }}>
                          <div>{new Date(m.starts_at).toLocaleDateString()}</div>
                          <span className="text-[10px] uppercase">{m.mode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }}>
          <div className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in" style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Schedule Meeting</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Discovery call..."
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Contact</label>
                  <select
                    value={meetingForm.contact_id}
                    onChange={(e) => setMeetingForm({ ...meetingForm, contact_id: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">None (General)</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Mode</label>
                  <select
                    value={meetingForm.mode}
                    onChange={(e) => setMeetingForm({ ...meetingForm, mode: e.target.value as MeetingMode })}
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
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Starts At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.starts_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, starts_at: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ends At *</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.ends_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, ends_at: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Link / Location</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/..."
                  value={meetingForm.location_or_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location_or_link: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Agenda</label>
                <textarea
                  rows={3}
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border-primary)" }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>Save Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
