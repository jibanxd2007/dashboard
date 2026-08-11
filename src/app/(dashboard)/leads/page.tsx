"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Download,
  Upload,
  Phone,
  MessageSquare,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { ContactItem } from "@/lib/mockStore";
import { ContactStage, ContactSource, ContactType } from "@/lib/database.types";

const STAGES: { id: ContactStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

const STAGE_COLORS: Record<string, string> = {
  new: "var(--blue)",
  contacted: "var(--indigo)",
  qualified: "var(--amber)",
  proposal: "var(--purple)",
  won: "var(--accent)",
  lost: "var(--text-muted)",
};

export default function LeadsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    email: "",
    phone: "",
    type: "lead" as ContactType,
    stage: "new" as ContactStage,
    source: "instagram" as ContactSource,
    deal_value: 0,
    tags: "",
    notes: "",
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(data);
    } catch (e) {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleStageChange = async (id: string, newStage: ContactStage) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c))
    );
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        toast.success(`Stage updated to ${newStage}`);
      } else {
        toast.error("Failed to update");
        fetchContacts();
      }
    } catch (e) {
      toast.error("Network error");
      fetchContacts();
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Lead created!");
        setIsAddModalOpen(false);
        setFormData({ full_name: "", company: "", email: "", phone: "", type: "lead", stage: "new", source: "instagram", deal_value: 0, tags: "", notes: "" });
        fetchContacts();
      } else {
        toast.error("Failed to create lead");
      }
    } catch (e) {
      toast.error("Error creating lead");
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(contacts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let count = 0;
        for (const row of results.data as any[]) {
          if (row.full_name && row.phone) {
            await fetch("/api/contacts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                full_name: row.full_name,
                company: row.company || "",
                email: row.email || "",
                phone: row.phone,
                stage: row.stage || "new",
                source: row.source || "manual",
                deal_value: Number(row.deal_value) || 0,
              }),
            });
            count++;
          }
        }
        toast.success(`Imported ${count} contacts`);
        fetchContacts();
      },
    });
  };

  const filteredContacts = contacts.filter((c) => {
    if (!c) return false;
    const q = (searchQuery || "").toLowerCase();
    const nameStr = (c.full_name || "").toLowerCase();
    const companyStr = (c.company || "").toLowerCase();
    const emailStr = (c.email || "").toLowerCase();
    const phoneStr = c.phone || "";
    const tagsArr = Array.isArray(c.tags) ? c.tags : [];

    const matchesSearch =
      nameStr.includes(q) ||
      companyStr.includes(q) ||
      emailStr.includes(q) ||
      phoneStr.includes(searchQuery) ||
      tagsArr.some((t) => (t || "").toLowerCase().includes(q));
    const matchesType = selectedType === "all" || c.type === selectedType;
    const matchesSource = selectedSource === "all" || c.source === selectedSource;
    return matchesSearch && matchesType && matchesSource;
  });

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };
  const selectStyle = { ...inputStyle };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Leads & Pipeline</h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage your sales pipeline.</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-lg border" style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
            <button
              onClick={() => setViewMode("kanban")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: viewMode === "kanban" ? "var(--accent-light)" : "transparent",
                color: viewMode === "kanban" ? "var(--accent-text)" : "var(--text-secondary)",
              }}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Board
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: viewMode === "table" ? "var(--accent-light)" : "transparent",
                color: viewMode === "table" ? "var(--accent-text)" : "var(--text-secondary)",
              }}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium border transition-colors" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <label className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border transition-colors" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-card)" }}>
            <Upload className="w-3.5 h-3.5" /> Import
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-64 md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input type="text" placeholder="Search leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm focus:outline-none" style={inputStyle} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="flex-1 sm:flex-none rounded-lg px-2.5 sm:px-3 py-2 text-xs focus:outline-none" style={selectStyle}>
            <option value="all">All Types</option>
            <option value="lead">Leads</option>
            <option value="client">Clients</option>
          </select>
          <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="flex-1 sm:flex-none rounded-lg px-2.5 sm:px-3 py-2 text-xs focus:outline-none" style={selectStyle}>
            <option value="all">All Sources</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="website">Website</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="referral">Referral</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 text-center text-sm" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : viewMode === "kanban" ? (
        /* Mobile-friendly Swipeable Kanban Columns */
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 scrollbar-thin">
          {STAGES.map((stg) => {
            const stageLeads = filteredContacts.filter((c) => c.stage === stg.id);
            const total = stageLeads.reduce((a, c) => a + (c.deal_value || 0), 0);
            return (
              <div key={stg.id} className="card p-3 flex flex-col min-w-[82vw] sm:min-w-[260px] max-w-[85vw] sm:max-w-[280px] snap-center shrink-0">
                <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[stg.id] }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{stg.label}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stageLeads.length}</span>
                  </div>
                  {total > 0 && <span className="text-[11px] font-mono" style={{ color: "var(--text-secondary)" }}>₹{(total / 1000).toFixed(0)}k</span>}
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[60vh]">
                  {stageLeads.length === 0 ? (
                    <div className="py-6 text-center border border-dashed rounded-lg text-xs" style={{ borderColor: "var(--border-secondary)", color: "var(--text-muted)" }}>Empty</div>
                  ) : (
                    stageLeads.map((contact) => (
                      <div key={contact.id} className="p-3 rounded-lg border space-y-2 group transition-colors" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}>
                        <div className="flex items-start justify-between">
                          <Link href={`/leads/${contact.id}`} className="font-medium text-xs sm:text-sm flex items-center gap-1 hover:underline truncate" style={{ color: "var(--text-primary)" }}>
                            {contact.full_name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
                          </Link>
                          {contact.deal_value > 0 && <span className="text-xs font-mono font-medium shrink-0 ml-1" style={{ color: "var(--accent-text)" }}>₹{contact.deal_value.toLocaleString("en-IN")}</span>}
                        </div>
                        {contact.company && <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{contact.company}</p>}
                        {contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>#{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border-secondary)" }}>
                          <div className="flex items-center gap-1">
                            <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-md transition-colors" style={{ color: "var(--accent-text)" }} title="WhatsApp">
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                            <a href={`tel:${contact.phone}`} className="p-1.5 rounded-md transition-colors" style={{ color: "var(--indigo)" }} title="Call">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <select value={contact.stage} onChange={(e) => handleStageChange(contact.id, e.target.value as ContactStage)} className="text-[10px] rounded px-1.5 py-1 focus:outline-none" style={{ background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-secondary)" }}>
                            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] sm:text-xs uppercase tracking-wider border-b" style={{ color: "var(--text-muted)", borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
                <tr>
                  <th className="p-3 sm:p-4">Name</th>
                  <th className="p-3 sm:p-4">Contact</th>
                  <th className="p-3 sm:p-4">Stage</th>
                  <th className="p-3 sm:p-4">Value</th>
                  <th className="p-3 sm:p-4">Source</th>
                  <th className="p-3 sm:p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b transition-colors" style={{ borderColor: "var(--border-secondary)" }}>
                    <td className="p-3 sm:p-4">
                      <Link href={`/leads/${contact.id}`} className="font-medium hover:underline" style={{ color: "var(--text-primary)" }}>{contact.full_name}</Link>
                      <div className="text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>{contact.company || "—"}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-[11px] sm:text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                      <div>{contact.phone}</div>
                      <div style={{ color: "var(--text-muted)" }}>{contact.email || "—"}</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <select value={contact.stage} onChange={(e) => handleStageChange(contact.id, e.target.value as ContactStage)} className="text-xs rounded-lg px-2 py-1 focus:outline-none" style={{ background: "var(--bg-input)", color: "var(--accent-text)", border: "1px solid var(--border-primary)" }}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="p-3 sm:p-4 font-mono font-medium" style={{ color: "var(--accent-text)" }}>₹{contact.deal_value.toLocaleString("en-IN")}</td>
                    <td className="p-3 sm:p-4">
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>{contact.source}</span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5">
                        <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-md" style={{ color: "var(--accent-text)" }}>
                          <MessageSquare className="w-4 h-4" />
                        </a>
                        <Link href={`/leads/${contact.id}`} className="p-1.5 rounded-md" style={{ color: "var(--text-secondary)" }}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal - Mobile Optimized */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ background: "var(--bg-modal-overlay)" }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl border space-y-4 animate-fade-in my-auto" style={{ background: "var(--bg-card)", borderColor: "var(--border-primary)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
              <h3 className="text-sm sm:text-base font-semibold" style={{ color: "var(--text-primary)" }}>New Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ color: "var(--text-muted)" }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
                  <input type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Full name" className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Company</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Phone *</label>
                  <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Stage</label>
                  <select value={formData.stage} onChange={(e) => setFormData({ ...formData, stage: e.target.value as ContactStage })} className="w-full rounded-lg px-2 sm:px-3 py-2 focus:outline-none" style={selectStyle}>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="proposal">Proposal</option><option value="won">Won</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Source</label>
                  <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as ContactSource })} className="w-full rounded-lg px-2 sm:px-3 py-2 focus:outline-none" style={selectStyle}>
                    <option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="website">Website</option><option value="linkedin">LinkedIn</option><option value="facebook">Facebook</option><option value="referral">Referral</option><option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Deal (₹)</label>
                  <input type="number" value={formData.deal_value} onChange={(e) => setFormData({ ...formData, deal_value: Number(e.target.value) })} className="w-full rounded-lg px-2 sm:px-3 py-2 focus:outline-none font-mono" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tags (comma-separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Comma-separated tags" className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inputStyle} />
              </div>
              <div className="pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border-primary)" }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
