"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { CaptureLinkItem, ContactItem } from "@/lib/mockStore";
import { ContactSource } from "@/lib/database.types";

export default function CaptureLinksPage() {
  const [links, setLinks] = useState<CaptureLinkItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<CaptureLinkItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    label: "",
    source: "instagram" as ContactSource,
    campaign: "",
  });

  const fetchData = async () => {
    try {
      const [lRes, cRes] = await Promise.all([
        fetch("/api/capture-links"),
        fetch("/api/contacts"),
      ]);
      const lData = await lRes.json();
      const cData = await cRes.json();
      setLinks(lData);
      setContacts(cData);
    } catch (e) {
      toast.error("Failed to load capture links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = (slug: string) => {
    const fullUrl = `${window.location.origin}/l/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    toast.success("Link copied!");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug || !form.label) {
      toast.error("Slug and label are required");
      return;
    }

    try {
      const res = await fetch("/api/capture-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Capture link created!");
        setIsCreateModalOpen(false);
        setForm({ slug: "", label: "", source: "instagram", campaign: "" });
        fetchData();
      } else {
        toast.error("Failed to create link");
      }
    } catch (e) {
      toast.error("Error creating capture link");
    }
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Lead Capture Links</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Share links or QR codes on Instagram, WhatsApp, or website.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <Plus className="w-4 h-4" /> Create Link
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading capture links...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((linkItem) => {
            const leadCount = contacts.filter((c) => c.tags.includes(linkItem.slug) || c.campaign === linkItem.campaign).length;

            return (
              <div key={linkItem.id} className="card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                      {linkItem.source}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Users className="w-3.5 h-3.5" /> {leadCount} Captured
                    </span>
                  </div>

                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{linkItem.label}</h3>

                  <div className="p-2 rounded-lg border text-xs font-mono break-all flex items-center justify-between gap-2" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)", color: "var(--text-secondary)" }}>
                    <span className="truncate">/l/{linkItem.slug}</span>
                    <a
                      href={`/l/${linkItem.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center gap-2" style={{ borderColor: "var(--border-secondary)" }}>
                  <button
                    onClick={() => handleCopy(linkItem.slug)}
                    className="flex-1 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                  >
                    {copiedSlug === linkItem.slug ? (
                      <>
                        <Check className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /> Copy Link
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveQrModal(linkItem)}
                    className="p-1.5 rounded-lg border transition-colors"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--accent-text)" }}
                    title="Generate QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }}>
          <div className="w-full max-w-xs p-6 rounded-xl border space-y-4 text-center animate-fade-in" style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{activeQrModal.label}</h3>
              <button onClick={() => setActiveQrModal(null)} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/l/${activeQrModal.slug}`}
                size={180}
                level="H"
              />
            </div>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Scan to open lead capture form.
            </p>

            <button
              onClick={() => handleCopy(activeQrModal.slug)}
              className="w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              <Copy className="w-4 h-4" /> Copy URL
            </button>
          </div>
        </div>
      )}

      {/* Create Link Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--bg-modal-overlay)" }}>
          <div className="w-full max-w-lg p-6 rounded-xl border space-y-4 animate-fade-in" style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Create Capture Link</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateLink} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Label Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Instagram Bio Link"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>URL Slug *</label>
                  <div className="flex items-center rounded-lg px-3 py-2 text-xs font-mono" style={inputStyle}>
                    <span style={{ color: "var(--text-muted)" }}>/l/</span>
                    <input
                      type="text"
                      required
                      placeholder="insta-bio"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="bg-transparent focus:outline-none w-full ml-1"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as ContactSource })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="website">Website</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign Tag</label>
                <input
                  type="text"
                  placeholder="bio_link_q3"
                  value={form.campaign}
                  onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border-primary)" }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>Create Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
