"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Shown when Supabase is not configured. In that state the app falls back to a
 * process-local in-memory store that is wiped on every restart and redeploy, so
 * anything entered will be lost. Warn loudly rather than silently losing data.
 */
export function StorageWarningBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.databaseConfigured === false) {
          setMessage(data.databaseMessage || "No database is configured.");
        }
      })
      .catch(() => {
        // Health check is best-effort; don't block the UI.
      });
  }, []);

  if (!message) return null;

  return (
    <div
      className="mb-4 p-3.5 rounded-xl flex items-start gap-3"
      style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444" }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          No database connected — data will not be saved
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {message} Until it is fixed, everything you enter is held in memory only and is lost when
          the server restarts. Set <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="font-mono">SUPABASE_SECRET_KEY</span>, then run{" "}
          <span className="font-mono">supabase/schema.sql</span>.
        </p>
      </div>
    </div>
  );
}
