"use client";

import { useState, use } from "react";
import { Zap, Send, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PublicLeadCapturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone) {
      toast.error("Please enter your name and phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/capture/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("Thank you! Your inquiry has been sent.");
      } else {
        toast.error("Failed to submit inquiry. Please try again.");
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md card p-8 space-y-6 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Get in Touch</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Fill out the brief form below and we will get back to you promptly.</p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Inquiry Received!</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Thank you, <strong style={{ color: "var(--accent-text)" }}>{formData.full_name}</strong>. We have received your message and will reach out shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="Priya Sharma"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full rounded-lg px-3.5 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Phone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg px-3.5 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Company / Brand</label>
                <input
                  type="text"
                  placeholder="Sharma Studio"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-lg px-3.5 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Email Address</label>
              <input
                type="email"
                placeholder="priya@sharmastudio.co"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg px-3.5 py-2 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>How can we help you?</label>
              <textarea
                rows={3}
                placeholder="Describe project requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg p-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {loading ? "Submitting..." : <><Send className="w-4 h-4" /> Send Inquiry</>}
            </button>
          </form>
        )}

        <div className="pt-3 border-t text-center" style={{ borderColor: "var(--border-secondary)" }}>
          <p className="text-[11px] flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} /> Direct Founder Inquiry
          </p>
        </div>
      </div>
    </div>
  );
}
