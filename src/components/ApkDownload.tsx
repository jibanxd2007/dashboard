"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

type Availability = "checking" | "available" | "unavailable";

/**
 * Probes whether an APK has actually been built for this deployment.
 * Without this the UI offers a download that returns 404, and the browser
 * saves the JSON error body as "sahoda-crm.apk".
 */
export function useApkAvailability(): Availability {
  const [state, setState] = useState<Availability>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/download/apk", { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setState(res.ok ? "available" : "unavailable");
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** Shown when no APK exists: explains the browser-install route instead. */
export function installFromBrowserHint() {
  toast.info("No APK is published yet — open this site in Chrome on Android and choose 'Add to Home screen' to install it as an app.", {
    duration: 6000,
  });
}

/** Compact link used in the sidebar and mobile header. */
export function ApkDownloadLink({
  variant,
  onNavigate,
}: {
  variant: "sidebar" | "header";
  onNavigate?: () => void;
}) {
  const availability = useApkAvailability();
  if (availability !== "available") return null;

  const shared = {
    href: "/api/download/apk",
    onClick: () => {
      toast.success("APK download started. Enable 'Install unknown apps' if Android prompts you.");
      onNavigate?.();
    },
  };

  if (variant === "header") {
    return (
      <a
        {...shared}
        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 no-underline"
        style={{ background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)" }}
      >
        <Download className="w-3.5 h-3.5" /> APK
      </a>
    );
  }

  return (
    <a
      {...shared}
      className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] mt-3 no-underline shadow-lg"
      style={{
        background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)",
        boxShadow: "0 4px 16px rgba(61, 220, 132, 0.25)",
      }}
    >
      <Download className="w-4 h-4 text-white" />
      <span>Download APK</span>
    </a>
  );
}

/** Full-width card used on the Settings page. */
export function ApkDownloadCard() {
  const availability = useApkAvailability();

  if (availability === "checking") {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-2xl text-xs"
        style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      >
        Checking for an Android build...
      </div>
    );
  }

  if (availability === "unavailable") {
    return (
      <div
        className="p-4 rounded-2xl space-y-2"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}
      >
        <p className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Smartphone className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
          Install from your browser
        </p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          No APK has been published for this deployment. You do not need one — open this site in
          Chrome on Android and choose <strong>Add to Home screen</strong>. It installs as a
          full-screen app with its own icon.
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          To publish a real APK instead, run the <span className="font-mono">Build Android APK</span>{" "}
          workflow in GitHub Actions. This button turns into a download once one exists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <a
        href="/api/download/apk"
        className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer no-underline"
        style={{
          background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)",
          boxShadow: "0 4px 24px rgba(61,220,132,0.3)",
        }}
        onClick={() =>
          toast.success("APK download started. Enable 'Install unknown apps' if Android prompts you.")
        }
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="white">
            <path d="M17.6 11.48 19.44 8.3a.63.63 0 1 0-1.09-.64l-1.86 3.22A10.17 10.17 0 0 0 12 10a10.17 10.17 0 0 0-4.49 1l-1.86-3.2A.63.63 0 0 0 4.56 8.3l1.84 3.18A9.16 9.16 0 0 0 3 19h18a9.16 9.16 0 0 0-3.4-7.52zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-white/75 mb-0.5">Direct APK Download</div>
          <div className="text-lg font-bold text-white leading-tight">Download for Android</div>
          <div className="text-[11px] text-white/70 mt-0.5">sahoda-crm.apk · Android 8.0+</div>
        </div>

        <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)" }}>
          <Download className="w-5 h-5 text-white" />
        </div>
      </a>

      <div
        className="rounded-xl p-3 space-y-2"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-secondary)" }}
      >
        <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
          How to install on Android:
        </p>
        <ol className="text-[11px] space-y-1.5 list-decimal list-inside" style={{ color: "var(--text-secondary)" }}>
          <li>Tap <strong>Download for Android</strong> above</li>
          <li>Open <strong>Downloads</strong> in your file manager</li>
          <li>Tap <strong>sahoda-crm.apk</strong>, then <strong>Install</strong></li>
          <li>If blocked: Settings &rarr; <strong>Install unknown apps</strong> &rarr; allow Chrome</li>
        </ol>
      </div>
    </div>
  );
}
