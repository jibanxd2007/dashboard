"use client";

import { useState, useEffect, useCallback } from "react";
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

/** datetime-local wants "YYYY-MM-DDTHH:mm" in local time. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Next whole hour, 30 minutes long — so the time fields are never blank. */
function defaultSlot() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  return {
    starts_at: toLocalInput(start),
    ends_at: toLocalInput(new Date(start.getTime() + 30 * 60000)),
  };
}

const emptyMeetingForm = () => ({
  title: "",
  ...defaultSlot(),
  mode: "video" as MeetingMode,
  location_or_link: "",
  agenda: "",
  attendee_ids: [] as string[],
});

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
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Both dialogs scroll, so a field failing validation is often above the fold.
   * Bring it into view and focus it, otherwise the submit looks like it did
   * nothing at all.
   */
  const revealFirstError = (found: Record<string, string>) => {
    const first = Object.keys(found)[0];
    if (!first) return;
    const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  };

  const validateMember = (form: typeof emptyMemberForm) => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = "Name is required.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "That does not look like an email address.";
    }
    return next;
  };

  const validateMeeting = (form: ReturnType<typeof emptyMeetingForm>) => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Give the meeting a title.";
    if (!form.starts_at) next.starts_at = "Pick a start time.";
    if (!form.ends_at) next.ends_at = "Pick an end time.";
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      next.ends_at = "End time must be after the start time.";
    }
    return next;
  };

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

  /** Backdrop click and Escape both close, unless a save is in flight. */
  const closeDialogs = useCallback(() => {
    if (saving) return;
    setMemberModal(false);
    setMeetingModal(false);
    setErrors({});
  }, [saving]);

  useEffect(() => {
    if (!memberModal && !meetingModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialogs();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [memberModal, meetingModal, closeDialogs]);

  const openNewMember = () => {
    setEditingId(null);
    setMemberForm(emptyMemberForm);
    setErrors({});
    setMemberModal(true);
  };

  const openNewMeeting = () => {
    setMeetingForm(emptyMeetingForm());
    setErrors({});
    setMeetingModal(true);
  };

  const openEditMember = (m: TeamMemberItem) => {
    setEditingId(m.id);
    setErrors({});
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
    if (saving) return;

    const found = validateMember(memberForm);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(found[Object.keys(found)[0]]);
      revealFirstError(found);
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
    if (saving) return;

    const found = validateMeeting(meetingForm);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(found[Object.keys(found)[0]]);
      revealFirstError(found);
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
        setMeetingForm(emptyMeetingForm());
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
  const errStyle = { ...inputStyle, border: "1px solid #ef4444" };
  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>
        {errors[key]}
      </p>
    ) : null;

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
          onClick={() => (tab === "members" ? openNewMember() : openNewMeeting())}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }} onClick={closeDialogs}>
          <div
            role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b sticky top-0 z-10 -mt-6 pt-6" style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {editingId ? "Edit Member" : "Add Team Member"}
              </h3>
              <button onClick={() => setMemberModal(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-sm" noValidate>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
                <input
                  type="text"
                  data-field="full_name"
                  aria-invalid={Boolean(errors.full_name)}
                  value={memberForm.full_name}
                  onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                  onBlur={() => setErrors(validateMember(memberForm))}
                  placeholder="Full name"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={errors.full_name ? errStyle : inputStyle}
                />
                {fieldError("full_name")}
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
                    data-field="email"
                    aria-invalid={Boolean(errors.email)}
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    onBlur={() => setErrors(validateMember(memberForm))}
                    placeholder="name@company.com"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={errors.email ? errStyle : inputStyle}
                  />
                  {fieldError("email")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }} onClick={closeDialogs}>
          <div
            role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}
          >
            <div className="flex items-center justify-between pb-3 border-b sticky top-0 z-10 -mt-6 pt-6" style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Schedule Team Meeting</h3>
              <button onClick={() => setMeetingModal(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3 text-sm" noValidate>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meeting Title *</label>
                <input
                  type="text"
                  data-field="title"
                  aria-invalid={Boolean(errors.title)}
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  onBlur={() => setErrors(validateMeeting(meetingForm))}
                  placeholder="e.g. Weekly standup"
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={errors.title ? errStyle : inputStyle}
                />
                {fieldError("title")}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Starts At * <span style={{ color: "var(--text-muted)" }}>(IST)</span>
                  </label>
                  <input
                    type="datetime-local"
                    data-field="starts_at"
                    aria-invalid={Boolean(errors.starts_at)}
                    value={meetingForm.starts_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, starts_at: e.target.value })}
                    onBlur={() => setErrors(validateMeeting(meetingForm))}
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
                    data-field="ends_at"
                    aria-invalid={Boolean(errors.ends_at)}
                    value={meetingForm.ends_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, ends_at: e.target.value })}
                    onBlur={() => setErrors(validateMeeting(meetingForm))}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={errors.ends_at ? errStyle : inputStyle}
                  />
                  {fieldError("ends_at")}
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
