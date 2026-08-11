"use client";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 text-center"
      style={{ background: "#161622", color: "#e2e8f0" }}
    >
      <div className="max-w-sm w-full space-y-4">
        <div className="text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-white">You're Offline</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Sahoda CRM needs an internet connection to sync your data. Check your Wi-Fi or mobile network and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl font-semibold text-xs text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #7C6FF7 0%, #6A5DE8 100%)" }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
