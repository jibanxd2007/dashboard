"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Trash2,
  Save,
  Plus,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ContactItem, TaskItem, MeetingItem, ActivityItem } from "@/lib/mockStore";
import { ContactStage } from "@/lib/database.types";
import { QuickVoiceNote } from "@/components/copilot/QuickVoiceNote";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [contact, setContact] = useState<ContactItem | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Note/Activity Form
  const [noteType, setNoteType] = useState<"note" | "call" | "whatsapp" | "email">("note");
  const [noteBody, setNoteBody] = useState("");

  // Editable Contact State
  const [editForm, setEditForm] = useState<Partial<ContactItem>>({});

  const loadData = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch(`/api/activities?contact_id=${id}`),
      ]);

      if (!cRes.ok) {
        toast.error("Contact not found");
        router.push("/leads");
        return;
      }

      const cData = await cRes.json();
      const aData = await aRes.json();

      setContact(cData);
      setEditForm(cData);
      setActivities(aData);
    } catch (e) {
      toast.error("Error loading contact details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        toast.success("Contact details updated!");
        loadData();
      } else {
        toast.error("Failed to update contact");
      }
    } catch (e) {
      toast.error("Error updating contact");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: id,
          type: noteType,
          body: noteBody,
        }),
      });

      if (res.ok) {
        toast.success("Activity logged!");
        setNoteBody("");
        loadData();
      } else {
        toast.error("Failed to log activity");
      }
    } catch (e) {
      toast.error("Error logging activity");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${contact?.full_name}?`)) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Contact deleted");
        router.push("/leads");
      } else {
        toast.error("Failed to delete contact");
      }
    } catch (e) {
      toast.error("Error deleting contact");
    }
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  if (loading) return <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading contact details...</div>;
  if (!contact) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button & Top Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="flex items-center gap-2 text-sm transition-colors hover:underline"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "var(--red-light)", color: "var(--red)" }}
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Contact
        </button>
      </div>

      {/* Main Header Card */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
          >
            {contact.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{contact.full_name}</h1>
              <span
                className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-md font-semibold"
                style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
              >
                {contact.type}
              </span>
            </div>
            {contact.company && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{contact.company}</p>}
            <div className="flex items-center gap-3 text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              <span>Source: <strong style={{ color: "var(--text-secondary)" }} className="capitalize">{contact.source}</strong></span>
              <span>•</span>
              <span>Added: <strong style={{ color: "var(--text-secondary)" }}>{new Date(contact.created_at).toLocaleDateString()}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <QuickVoiceNote contactId={contact.id} contactName={contact.full_name} onSuccess={loadData} />
          <a
            href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(contact.full_name)},`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "var(--indigo-light)", color: "var(--indigo)" }}
          >
            <Phone className="w-4 h-4" /> Call
          </a>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      </div>

      {/* Grid: Left metadata form, Right activity timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Contact Details & Edit Form */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <User className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Details & Metadata
            </h3>
            <button
              onClick={handleUpdateContact}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Full Name</label>
              <input
                type="text"
                value={editForm.full_name || ""}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Company</label>
              <input
                type="text"
                value={editForm.company || ""}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Phone</label>
                <input
                  type="text"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Stage</label>
                <select
                  value={editForm.stage || "new"}
                  onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as ContactStage })}
                  className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                  style={inputStyle}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Deal Value (₹)</label>
                <input
                  type="number"
                  value={editForm.deal_value || 0}
                  onChange={(e) => setEditForm({ ...editForm, deal_value: Number(e.target.value) })}
                  className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium" style={{ color: "var(--text-secondary)" }}>Notes</label>
              <textarea
                rows={4}
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Right Col: Add Note / Activity Logger & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Activity/Note */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Plus className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Log Activity / Note
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center gap-1.5">
                {[
                  { id: "note", label: "Note" },
                  { id: "call", label: "Call Log" },
                  { id: "whatsapp", label: "WhatsApp" },
                  { id: "email", label: "Email" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setNoteType(type.id as any)}
                    className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                    style={{
                      background: noteType === type.id ? "var(--accent-light)" : "var(--bg-secondary)",
                      color: noteType === type.id ? "var(--accent-text)" : "var(--text-secondary)",
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                placeholder="Log conversation details or notes..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                className="w-full rounded-lg p-3 text-xs focus:outline-none"
                style={inputStyle}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  <Send className="w-3.5 h-3.5" /> Log Activity
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Clock className="w-4 h-4" style={{ color: "var(--indigo)" }} /> Activity Timeline
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5" style={{ "--tw-before-bg": "var(--border-secondary)" } as any}>
              {activities.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No activities logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative pl-7 space-y-1">
                    <div className="absolute left-1.5 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full border-2" style={{ background: "var(--bg-card)", borderColor: "var(--accent)" }} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-[10px] tracking-wider" style={{ color: "var(--accent-text)" }}>
                        {act.type}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {new Date(act.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs p-3 rounded-lg border" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", color: "var(--text-primary)" }}>
                      {act.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
