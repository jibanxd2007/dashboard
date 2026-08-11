"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Video,
  Phone,
  MapPin,
  Clock,
  X,
  Mail,
  Trash2,
  Pencil,
  CheckCircle2,
  ExternalLink,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { TeamMemberItem, TeamMeetingItem } from "@/lib/mockStore";
import { MeetingMode, TeamRole, TeamMemberStatus } from "@/lib/database.types";

const ROLE_STYLES: Record<TeamRole, { bg: string; fg: string; label: string }> = {
  owner: { bg: "var(--purple-light)", fg: "var(--purple)", label: "Owner" },
  manager: { bg: "var(--indigo-light)", fg: "var(--indigo)", label: "Manager" },
  member: { bg: "var(--accent-light)", fg: "var(--accent-text)", label: "Member" },
};

const emptyMemberForm = {
  full_name: "",
  title: "",
  email: "",
  phone: "",
  role: "member" as TeamRole,
  status: "active" as TeamMemberStatus,
  notes: "",
};

const emptyMeetingForm = {
  title: "",
  starts_at: "",
  ends_at: "",
  mode: "video" as MeetingMode,
  location_or_link: "",
  agenda: "",
  attendee_ids: [] as string[],
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export default function TeamPage() {
  const [tab, setTab] = useState<"members" | "meetings">("members");
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [meetings, setMeetings] = useState<TeamMeetingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [memberModal, setMemberModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);

  const [meetingModal, setMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch("/api/team/members"),
        fetch("/api/team/meetings"),
      ]);
      if (mRes.ok) setMembers(await mRes.json());
      if (tRes.ok) setMeetings(await tRes.json());
    } catch {
      toast.error("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewMember = () => {
    setEditingId(null);
    setMemberForm(emptyMemberForm);
    setMemberModal(true);
  };

  const openEditMember = (m: TeamMemberItem) => {
    setEditingId(m.id);
    setMemberForm({
      full_name: m.full_name,
      title: m.title || "",
      email: m.email || "",
      phone: m.phone || "",
      role: m.role,
      status: m.status,
      notes: m.notes || "",
    });
    setMemberModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/team/members/${editingId}` : "/api/team/members",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberForm),
        }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Member updated" : `${memberForm.full_name} added to the team`);
        setMemberModal(false);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save member");
      }
    } catch {
      toast.error("Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (m: TeamMemberItem) => {
    if (!confirm(`Remove ${m.full_name} from the team? They will also be removed from any scheduled meetings.`)) return;
    try {
      const res = await fetch(`/api/team/members/${m.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${m.full_name} removed`);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.starts_at || !meetingForm.ends_at) {
      toast.error("Title, start and end time are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/team/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meetingForm),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Team meeting scheduled");
        setMeetingModal(false);
        setMeetingForm(emptyMeetingForm);
        fetchData();
      } else {
        toast.error(data.error || "Failed to schedule meeting");
      }
    } catch {
      toast.error("Failed to schedule meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (m: TeamMeetingItem) => {
    if (!confirm(`Delete "${m.title}"?`)) return;
    try {
      const res = await fetch(`/api/team/meetings/${m.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Meeting deleted");
        fetchData();
      } else {
        toast.error("Failed to delete meeting");
      }
    } catch {
      toast.error("Failed to delete meeting");
    }
  };

  const toggleAttendee = (id: string) => {
    setMeetingForm((f) => ({
      ...f,
      attendee_ids: f.attendee_ids.includes(id)
        ? f.attendee_ids.filter((a) => a !== id)
        : [...f.attendee_ids, id],
    }));
  };

  const now = new Date();
  const activeMembers = members.filter((m) => m.status === "active");
  const upcoming = meetings.filter((m) => new Date(m.ends_at) >= now && m.status !== "cancelled");
  const past = meetings.filter((m) => new Date(m.ends_at) < now || m.status === "completed");

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border-primary)",
    color: "var(--text-primary)",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage your team and schedule internal meetings.
          </p>
        </div>
        <button
          onClick={() => (tab === "members" ? openNewMember() : setMeetingModal(true))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <Plus className="w-4 h-4" />
          {tab === "members" ? "Add Member" : "Schedule Meeting"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
        {([
          { key: "members", label: `Members (${members.length})`, icon: Users },
          { key: "meetings", label: `Meetings (${upcoming.length})`, icon: CalendarDays },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors -mb-px"
            style={{
              color: tab === key ? "var(--accent-text)" : "var(--text-muted)",
              borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading team...</div>
      ) : tab === "members" ? (
        members.length === 0 ? (
          <div className="card p-10 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No team members yet.</p>
            <button
              onClick={openNewMember}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              Add your first member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => {
              const role = ROLE_STYLES[m.role] || ROLE_STYLES.member;
              return (
                <div key={m.id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #7C6FF7 0%, #A78BFA 100%)",
                          color: "#FFFFFF",
                          opacity: m.status === "active" ? 1 : 0.45,
                        }}
                      >
                        {initials(m.full_name) || "?"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {m.full_name}
                        </h3>
                        {m.title && (
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{m.title}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditMember(m)}
                        title="Edit"
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(m)}
                        title="Remove"
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded"
                      style={{ background: role.bg, color: role.fg }}
                    >
                      {role.label}
                    </span>
                    {m.status === "inactive" && (
                      <span
                        className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded"
                        style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>

                  {(m.email || m.phone) && (
                    <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                      {m.email && (
                        <a
                          href={`mailto:${m.email}`}
                          className="text-xs flex items-center gap-1.5 hover:underline truncate"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                          <span className="truncate">{m.email}</span>
                        </a>
                      )}
                      {m.phone && (
                        <a
                          href={`tel:${m.phone}`}
                          className="text-xs flex items-center gap-1.5 hover:underline"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                          {m.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {m.notes && (
                    <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{m.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <CalendarDays className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Upcoming ({upcoming.length})
            </h2>

            {upcoming.length === 0 ? (
              <div className="card p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No upcoming team meetings.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((m) => {
                  const attendees = members.filter((p) => (m.attendee_ids || []).includes(p.id));
                  return (
                    <div key={m.id} className="card p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-medium flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
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
                                m.mode === "video" ? "var(--purple-light)" : m.mode === "call" ? "var(--indigo-light)" : "var(--amber-light)",
                              color: m.mode === "video" ? "var(--purple)" : m.mode === "call" ? "var(--indigo)" : "var(--amber)",
                            }}
                          >
                            {m.mode === "video" ? <Video className="w-3 h-3" /> : m.mode === "call" ? <Phone className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {m.mode}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</h3>

                        {attendees.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                            {attendees.map((a) => (
                              <span
                                key={a.id}
                                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                              >
                                {a.full_name}
                              </span>
                            ))}
                          </div>
                        )}

                        {m.agenda && (
                          <p
                            className="text-xs p-2 rounded-lg border line-clamp-2"
                            style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}
                          >
                            {m.agenda}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border-secondary)" }}>
                        {m.location_or_link ? (
                          m.location_or_link.startsWith("http") ? (
                            <a
                              href={m.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "var(--accent-text)" }}
                            >
                              Join <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{m.location_or_link}</span>
                          )
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => handleDeleteMeeting(m)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                          style={{ color: "#ef4444" }}
                          title="Delete meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> Past ({past.length})
              </h2>
              <div className="card overflow-hidden">
                <div className="divide-y" style={{ borderColor: "var(--border-secondary)" }}>
                  {past.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</span>
                      <span className="font-mono" style={{ color: "var(--text-muted)" }}>
                        {new Date(m.starts_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member modal */}
      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }}>
          <div
            className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingId ? "Edit Member" : "Add Team Member"}
              </h3>
              <button onClick={() => setMemberModal(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={memberForm.full_name}
                  onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  placeholder="Full name"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Job Title</label>
                  <input
                    type="text"
                    value={memberForm.title}
                    onChange={(e) => setMemberForm({ ...memberForm, title: e.target.value })}
                    placeholder="e.g. Designer"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Role</label>
                  <select
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as TeamRole })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                  <input
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Phone</label>
                  <input
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Status</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as TeamMemberStatus })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
                <textarea
                  rows={2}
                  value={memberForm.notes}
                  onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border-primary)" }}>
                <button
                  type="button"
                  onClick={() => setMemberModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting modal */}
      {meetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }}>
          <div
            className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Schedule Team Meeting</h3>
              <button onClick={() => setMeetingModal(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  placeholder="e.g. Weekly standup"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
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

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Link / Location</label>
                <input
                  type="text"
                  value={meetingForm.location_or_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location_or_link: e.target.value })}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Attendees {meetingForm.attendee_ids.length > 0 && `(${meetingForm.attendee_ids.length})`}
                </label>
                {activeMembers.length === 0 ? (
                  <p className="text-xs p-3 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                    No active team members yet. Add members first to invite them.
                  </p>
                ) : (
                  <div
                    className="flex flex-wrap gap-1.5 p-2 rounded-lg max-h-32 overflow-y-auto"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {activeMembers.map((m) => {
                      const selected = meetingForm.attendee_ids.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleAttendee(m.id)}
                          className="text-xs px-2.5 py-1 rounded-full font-medium transition-all border"
                          style={{
                            background: selected ? "var(--accent)" : "var(--bg-card)",
                            color: selected ? "var(--text-inverse)" : "var(--text-secondary)",
                            borderColor: selected ? "var(--accent)" : "var(--border-primary)",
                          }}
                        >
                          {m.full_name}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                <button
                  type="button"
                  onClick={() => setMeetingModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  {saving ? "Saving..." : "Save Meeting"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
