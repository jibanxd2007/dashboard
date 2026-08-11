"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Calendar,
  Link2,
  Settings,
  Lock,
  Menu,
  X,
  Zap,
  Sparkles,
  Check,
  Clock,
  LogOut,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "../ThemeProvider";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads & CRM", href: "/leads", icon: Users },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Capture Links", href: "/capture-links", icon: Link2 },
  { label: "AI Copilot", href: "/ask", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLock = async () => {
    try {
      await fetch("/api/auth/lock", { method: "POST" });
      toast.info("Session locked");
      router.push("/unlock");
      router.refresh();
    } catch (e) {
      toast.error("Failed to lock session");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--bg-primary)" }}>
      {/* Mobile Top Header */}
      <div
        className="md:hidden flex items-center justify-between p-4 sticky top-0 z-40 border-b"
        style={{ background: "#161622", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)", color: "#FFFFFF" }}
          >
            <Zap className="w-4 h-4 fill-current" />
          </div>
          Sahoda<span style={{ color: "var(--accent)" }}>CRM</span>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href="/api/download/apk"
            download="sahoda-crm.apk"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)" }}
            onClick={() => toast.success("APK download started!")}
          >
            <Download className="w-3.5 h-3.5" /> APK
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg transition-colors text-slate-300 hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar — Reference Style Dark Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col justify-between p-5 transition-transform duration-200 ease-in-out shrink-0 overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "#161622",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="space-y-6">
          {/* User Profile Header (Matching reference image) */}
          <div className="flex items-center gap-3 px-1 pt-1">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #7C6FF7 0%, #A78BFA 100%)" }}
            >
              SC
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate leading-snug">Sahoda Founder</h4>
              <p className="text-[11px] text-slate-400 truncate">Agency Owner</p>
            </div>
          </div>

          {/* Greeting text */}
          <div className="px-1">
            <h3 className="text-lg font-bold text-white leading-tight">
              Hey Founder 👋
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Let's get something done
            </p>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 pt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                  style={{
                    background: isActive ? "#262638" : "transparent",
                    borderLeft: isActive ? "3px solid #7C6FF7" : "3px solid transparent",
                  }}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-[#7C6FF7]" : "text-slate-400"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}

            {/* Direct APK Download Button in Navigation Bar */}
            <a
              href="/api/download/apk"
              download="sahoda-crm.apk"
              onClick={() => toast.success("Downloading Sahoda CRM APK...")}
              className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] mt-3 no-underline shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3DDC84 0%, #1fa856 100%)",
                boxShadow: "0 4px 16px rgba(61, 220, 132, 0.25)",
              }}
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download APK</span>
              <span className="ml-auto text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono text-white">
                v1.0
              </span>
            </a>
          </nav>
        </div>

        {/* Sidebar Footer — Reference Widget + Lock */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {/* Quick Schedule Card (Reference image bottom widget) */}
          <div
            className="p-3.5 rounded-2xl space-y-2.5"
            style={{ background: "#222234", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#7C6FF7]" /> Next Task
              </span>
              <span>12:00 - 12:30</span>
            </div>
            <p className="text-xs font-semibold text-white truncate">
              Follow up with new leads
            </p>
            <div className="flex gap-2">
              <Link
                href="/tasks"
                className="flex-1 py-1.5 rounded-lg text-center text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "#7C6FF7" }}
              >
                Complete
              </Link>
              <button
                type="button"
                onClick={() => toast.info("Reminder snoozed 30m")}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-white/10"
              >
                Later
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ThemeToggle />
            </div>
            <button
              onClick={handleLock}
              className="p-2.5 rounded-xl transition-colors text-red-400 hover:bg-red-500/10 flex items-center justify-center shrink-0"
              title="Lock Session"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "var(--bg-modal-overlay)" }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden relative">
        {children}
        <CopilotDrawer />
      </main>
    </div>
  );
}

