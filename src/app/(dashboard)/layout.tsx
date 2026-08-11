"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UsersRound,
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
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "../ThemeProvider";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";
import { StorageWarningBanner } from "@/components/StorageWarningBanner";
import { ApkDownloadLink } from "@/components/ApkDownload";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads & CRM", href: "/leads", icon: Users },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Meetings", href: "/meetings", icon: Calendar },
  { label: "Team", href: "/team", icon: UsersRound },
  { label: "Capture Links", href: "/capture-links", icon: Link2 },
  { label: "AI Copilot", href: "/ask", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Sidebar widget showing the soonest open task, with a one-click complete. */
function NextTaskWidget() {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const load = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) return;
      const tasks = await res.json();
      const open = (Array.isArray(tasks) ? tasks : [])
        .filter((t: any) => t.status === "open")
        .sort((a: any, b: any) => {
          if (!a.due_at) return 1;
          if (!b.due_at) return -1;
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        });
      setTask(open[0] || null);
    } catch {
      // Sidebar widget is non-critical — stay silent on failure.
    } finally {
      setLoading(false);
    }
  };

  // Refresh when navigating so the widget reflects edits made on other pages.
  useEffect(() => {
    load();
  }, [pathname]);

  const handleComplete = async () => {
    if (!task) return;
    const completed = task;
    setTask(null);
    try {
      const res = await fetch(`/api/tasks/${completed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: completed.status }),
      });
      if (res.ok) {
        toast.success("Task completed! 🎉");
        load();
      } else {
        toast.error("Failed to complete task");
        setTask(completed);
      }
    } catch {
      toast.error("Failed to complete task");
      setTask(completed);
    }
  };

  if (loading || !task) return null;

  const due = task.due_at ? new Date(task.due_at) : null;
  const isOverdue = due ? due.getTime() < Date.now() : false;

  return (
    <div
      className="p-3.5 rounded-2xl space-y-2.5"
      style={{ background: "#222234", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between text-[11px] font-medium">
        <span className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3 h-3 text-[#7C6FF7]" /> Next Task
        </span>
        <span className={isOverdue ? "text-red-400" : "text-slate-400"}>
          {due
            ? due.toLocaleString(undefined, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No due date"}
        </span>
      </div>
      <p className="text-xs font-semibold text-white truncate" title={task.title}>
        {task.title}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleComplete}
          className="flex-1 py-1.5 rounded-lg text-center text-[11px] font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1"
          style={{ background: "#7C6FF7" }}
        >
          <Check className="w-3 h-3" /> Complete
        </button>
        <Link
          href="/tasks"
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-300 hover:bg-white/10 no-underline flex items-center"
        >
          View all
        </Link>
      </div>
    </div>
  );
}

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
          <ApkDownloadLink variant="header" />
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

            {/* Only rendered when an APK has actually been built */}
            <ApkDownloadLink variant="sidebar" onNavigate={() => setMobileMenuOpen(false)} />
          </nav>
        </div>

        {/* Sidebar Footer — Reference Widget + Lock */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {/* Next open task — real data */}
          <NextTaskWidget />

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
        <StorageWarningBanner />
        {children}
        <CopilotDrawer />
      </main>
    </div>
  );
}

