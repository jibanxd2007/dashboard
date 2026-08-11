"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Bell,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Key,
  Clock,
  Sparkles,
  Lock,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { SettingsItem } from "@/lib/mockStore";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<SettingsItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingMsg, setTestingMsg] = useState(false);
  const [tokenUsage, setTokenUsage] = useState({ totalInput: 4250, totalOutput: 1840 });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Settings saved!");
        fetchSettings();
      } else {
        toast.error("Failed to save settings");
      }
    } catch (e) {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setTestingMsg(true);
    try {
      const res = await fetch("/api/notify/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`WhatsApp alert sent via ${data.provider}!`);
      } else {
        toast.error(`Test failed: ${data.error || "Check credentials"}`);
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setTestingMsg(false);
    }
  };

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  if (loading) return <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          WhatsApp notifications, AI Privacy, and system parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* AI Copilot & Privacy Card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold pb-3 border-b flex items-center gap-2" style={{ color: "var(--text-primary)", borderColor: "var(--border-secondary)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> AI Copilot & Privacy Controls
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
              <div>
                <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Redact Client PII (Privacy Guard)</h4>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Mask phone numbers & emails in AI prompts. Real values resolve server-side.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, redact_pii: !(settings as any).redact_pii })}
                className={`toggle-switch ${(settings as any).redact_pii !== false ? "active" : ""}`}
              />
            </div>

            {/* Token Usage Metric */}
            <div className="p-3 rounded-lg border flex items-center justify-between text-xs" style={{ background: "var(--bg-card)", borderColor: "var(--border-secondary)" }}>
              <div>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Monthly AI Token Usage</span>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Logged for cost tracking</p>
              </div>
              <div className="font-mono text-right" style={{ color: "var(--accent-text)" }}>
                <div>Input: {tokenUsage.totalInput.toLocaleString()} tokens</div>
                <div>Output: {tokenUsage.totalOutput.toLocaleString()} tokens</div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-secondary)" }}>
            <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MessageSquare className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> CallMeBot / TextMeBot Credentials
            </h2>
            <button
              type="button"
              onClick={handleTestWhatsApp}
              disabled={testingMsg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
            >
              <Send className="w-3.5 h-3.5" /> {testingMsg ? "Sending..." : "Test Alert"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                <Smartphone className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} /> Phone (with Country Code)
              </label>
              <input
                type="text"
                placeholder="+919876543210"
                value={settings.whatsapp_number || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block font-medium mb-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                <Key className="w-3.5 h-3.5" style={{ color: "var(--amber)" }} /> API Key (TextMeBot / CallMeBot)
              </label>
              <input
                type="text"
                placeholder="XojF4J8haTSy"
                value={settings.callmebot_key || ""}
                onChange={(e) => setSettings({ ...settings, callmebot_key: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                style={inputStyle}
              />
              <div className="text-[11px] mt-2 flex items-center justify-between gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1">
                  Activate TextMeBot:
                  <a
                    href="https://api.textmebot.com/addphone.php?apikey=XojF4J8haTSy"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-indigo-500 hover:text-indigo-600 font-medium"
                  >
                    Link Phone
                  </a>
                </span>
                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={testingMsg}
                  className="px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {testingMsg ? "Sending..." : "⚡ Send Test WhatsApp"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Triggers */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold pb-3 border-b flex items-center gap-2" style={{ color: "var(--text-primary)", borderColor: "var(--border-secondary)" }}>
            <Bell className="w-4 h-4" style={{ color: "var(--indigo)" }} /> Notification Triggers
          </h2>

          <div className="space-y-2">
            {[
              { id: "notify_new_lead", title: "New Lead Capture", desc: "Instant alert on lead form submit or creation." },
              { id: "notify_task_due", title: "Task Due Reminders", desc: "Alert 1 hour before task deadline." },
              { id: "notify_meeting", title: "Meeting Alerts", desc: "Alert 30 minutes before scheduled call." },
              { id: "notify_digest", title: "Daily Morning Digest", desc: "Daily morning briefing." },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                <div>
                  <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, [item.id]: !(settings as any)[item.id] })}
                  className={`toggle-switch ${Boolean((settings as any)[item.id]) ? "active" : ""}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Automation Thresholds */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-semibold pb-3 border-b flex items-center gap-2" style={{ color: "var(--text-primary)", borderColor: "var(--border-secondary)" }}>
            <Clock className="w-4 h-4" style={{ color: "var(--amber)" }} /> Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Stale Lead Warning (Days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.stale_lead_days || 7}
                onChange={(e) => setSettings({ ...settings, stale_lead_days: Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Daily Digest Hour (24-Hour)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={settings.digest_hour ?? 8}
                onChange={(e) => setSettings({ ...settings, digest_hour: Number(e.target.value) })}
                className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: "var(--accent-text)" }} />
            <div>
              <h4 className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>App Access PIN</h4>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current PIN: <span className="font-mono font-semibold" style={{ color: "var(--accent-text)" }}>123456</span></p>
            </div>
          </div>
        </div>

        {/* Demo Data Management & Going Live */}
        <div className="card p-5 space-y-3 border" style={{ borderColor: "var(--red-light)", background: "var(--bg-secondary)" }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Lock className="w-4 h-4 text-red-400" /> Go Live Data Management
          </h2>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Remove sample contacts (Rahul Verma, Priya Sharma), mock tasks, and meetings to start with a clean database for real clients.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to purge all demo contacts, tasks, and meetings?")) {
                  try {
                    const res = await fetch("/api/settings/reset", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "clear" }),
                    });
                    if (res.ok) {
                      toast.success("Demo showcase data purged! Your CRM is ready for live leads.");
                      window.location.reload();
                    }
                  } catch (e) {
                    toast.error("Failed to clear demo data");
                  }
                }
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border"
              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderColor: "#ef4444" }}
            >
              Purge Demo Showcase Data
            </button>

            <button
              type="button"
              onClick={async () => {
                if (confirm("Restore sample demo contacts and pipeline items?")) {
                  try {
                    const res = await fetch("/api/settings/reset", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "seed" }),
                    });
                    if (res.ok) {
                      toast.success("Demo showcase data restored!");
                      window.location.reload();
                    }
                  } catch (e) {
                    toast.error("Failed to restore demo data");
                  }
                }
              }}
              className="px-3.5 py-2 rounded-lg text-xs font-medium transition-all border"
              style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
            >
              Restore Sample Showcase Data
            </button>
          </div>
        </div>

        {/* Mobile App PWA Installation */}
        <PWAInstallPrompt />

        {/* Recent AI Actions Audit Log (Last 7 Days) */}
        <RecentActionsAuditLog />

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RecentActionsAuditLog() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/ai/undo");
      const data = await res.json();
      if (data.success) {
        setActions(data.actions || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleUndo = async (actionId: string) => {
    try {
      const res = await fetch("/api/ai/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Action undone!");
        fetchActions();
      } else {
        toast.error(data.error || "Failed to undo action");
      }
    } catch (e) {
      toast.error("Error undoing action");
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <h2 className="text-base font-semibold pb-3 border-b flex items-center gap-2" style={{ color: "var(--text-primary)", borderColor: "var(--border-secondary)" }}>
        <RefreshCw className="w-4 h-4" style={{ color: "var(--teal)" }} /> Recent AI Actions (Last 7 Days)
      </h2>
      {loading ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading recent actions...</p>
      ) : actions.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>No AI actions recorded in the last 7 days.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {actions.map((act) => (
            <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg border text-xs" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-secondary)" }}>
              <div>
                <span className="font-semibold font-mono" style={{ color: "var(--accent-text)" }}>{act.tool}</span>
                <span className="text-[11px] ml-2" style={{ color: "var(--text-muted)" }}>
                  {new Date(act.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </span>
              </div>
              {act.undone_at ? (
                <span className="text-[11px] font-medium text-red-500">Undone</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUndo(act.id)}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-red-600 hover:bg-red-700 text-white transition"
                >
                  Undo Action
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PWAInstallPrompt() {
  const [macStep, setMacStep] = useState(false);

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border-secondary)" }}>
        <Download className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Download App
        </h2>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
          v1.0.0
        </span>
      </div>

      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Install Sahoda CRM as a native app on your Android phone — no Play Store required. 
        Just download the APK, tap to install, and you're live.
      </p>

      {/* Android APK Download — main CTA */}
      <a
        href="/api/download/apk"
        download="sahoda-crm.apk"
        id="download-apk-btn"
        className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer no-underline"
        style={{ background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)", boxShadow: "0 4px 24px rgba(61,220,132,0.3)" }}
        onClick={() => toast.success("APK download started! Enable 'Install unknown apps' in Android settings if prompted.")}
      >
        {/* Robot icon */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M17.6 11.48 19.44 8.3a.63.63 0 1 0-1.09-.64l-1.86 3.22A10.17 10.17 0 0 0 12 10a10.17 10.17 0 0 0-4.49 1l-1.86-3.2A.63.63 0 0 0 4.56 8.3l1.84 3.18A9.16 9.16 0 0 0 3 19h18a9.16 9.16 0 0 0-3.4-7.52zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-white/75 mb-0.5">Direct APK Download</div>
          <div className="text-lg font-bold text-white leading-tight">Download for Android</div>
          <div className="text-[11px] text-white/70 mt-0.5 flex items-center gap-1">
            <span>sahoda-crm.apk</span>
            <span>•</span>
            <span>Supports Android 8.0+</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)" }}>
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] text-white/80 font-medium">FREE</span>
        </div>
      </a>

      {/* Install instructions for Android */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}>
        <p className="text-[11px] font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
          <span>📋</span> How to install the APK on Android:
        </p>
        <ol className="text-[11px] space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-secondary)" }}>
          <li>Tap <strong>Download for Android</strong> above</li>
          <li>Open <strong>Downloads</strong> in your file manager</li>
          <li>Tap <strong>sahoda-crm.apk</strong> → tap <strong>Install</strong></li>
          <li>If blocked: Settings → <strong>Install unknown apps</strong> → Allow Chrome</li>
          <li>Tap <strong>Open</strong> — you're live 🚀</li>
        </ol>
      </div>

      {/* Mac / Desktop divider */}
      <div className="border-t pt-3" style={{ borderColor: "var(--border-secondary)" }}>
        <button
          type="button"
          onClick={() => setMacStep((v) => !v)}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #1d6ef5 0%, #0a47c2 100%)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <div className="text-[10px] font-medium text-white/75">Install as native app on</div>
            <div className="text-sm font-bold text-white">Mac / Desktop</div>
          </div>
          <span className="text-white/70 text-sm">{macStep ? "▲" : "▼"}</span>
        </button>

        {macStep && (
          <div className="mt-2 p-3 rounded-xl text-[11px] space-y-1.5" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No download needed — install from browser:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Safari:</strong> File menu → <strong>"Add to Dock"</strong></li>
              <li><strong>Chrome:</strong> Click ⊕ in address bar → <strong>"Install app"</strong></li>
              <li>Launches in its own window like a native Mac app</li>
            </ol>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Works offline · No App Store · Docks to your Taskbar/Dock
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
