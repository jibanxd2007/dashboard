import Link from "next/link";
import {
  Users,
  Briefcase,
  IndianRupee,
  CheckSquare,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Clock,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { getContacts } from "@/lib/queries/contacts";
import { getTasks } from "@/lib/queries/tasks";
import { getMeetings } from "@/lib/queries/meetings";
import { getActivities } from "@/lib/queries/activities";
import { getSettings } from "@/lib/queries/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [contacts, tasks, meetings, activities, settings] = await Promise.all([
    getContacts(),
    getTasks(),
    getMeetings(),
    getActivities(),
    getSettings(),
  ]);

  const now = new Date();
  const staleThresholdDays = settings.stale_lead_days || 7;
  const staleMs = staleThresholdDays * 24 * 60 * 60 * 1000;

  const leads = contacts.filter((c) => c.type === "lead");
  const activeClients = contacts.filter((c) => c.type === "client" || c.stage === "won" || c.stage === "active");
  const totalPipelineValue = contacts
    .filter((c) => !["lost", "churned"].includes(c.stage))
    .reduce((sum, c) => sum + (c.deal_value || 0), 0);

  const openTasks = tasks.filter((t) => t.status === "open");

  const todayMeetings = meetings.filter((m) => {
    const d = new Date(m.starts_at);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      m.status !== "cancelled"
    );
  });

  const staleLeads = leads.filter((l) => {
    if (["won", "lost"].includes(l.stage)) return false;
    const lastContact = l.last_contacted_at || l.created_at;
    const diff = now.getTime() - new Date(lastContact).getTime();
    return diff > staleMs;
  });

  const recentActivities = activities.slice(0, 5);

  const kpis = [
    { label: "Total Leads", value: leads.length, sub: `${contacts.filter(c => c.stage === 'new').length} new`, icon: Users, color: "var(--accent)" },
    { label: "Active Clients", value: activeClients.length, sub: "Paying", icon: Briefcase, color: "var(--indigo)" },
    { label: "Pipeline Value", value: `₹${totalPipelineValue.toLocaleString("en-IN")}`, sub: "Active deals", icon: IndianRupee, color: "var(--amber)" },
    { label: "Open Tasks", value: openTasks.length, sub: `${todayMeetings.length} meetings today`, icon: CheckSquare, color: "var(--purple)" },
  ];

  const stages = [
    { stage: "new", label: "New", color: "var(--blue)" },
    { stage: "contacted", label: "Contacted", color: "var(--indigo)" },
    { stage: "qualified", label: "Qualified", color: "var(--amber)" },
    { stage: "proposal", label: "Proposal", color: "var(--purple)" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Your business at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/leads?action=new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
          >
            <CheckSquare className="w-4 h-4" />
            New Task
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="card p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                <h3 className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{kpi.value}</h3>
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{kpi.sub}</p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${kpi.color} 12%, transparent)`, color: kpi.color }}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stale Leads Warning */}
      {staleLeads.length > 0 && (
        <div
          className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          style={{ background: "var(--amber-light)", border: "1px solid var(--amber)" }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: "var(--amber)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {staleLeads.length} stale lead{staleLeads.length > 1 ? "s" : ""} need follow-up
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Not contacted in {staleThresholdDays}+ days: {staleLeads.slice(0, 3).map((l) => l.full_name).join(", ")}
              </p>
            </div>
          </div>
          <Link
            href="/leads"
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            style={{ background: "var(--amber)", color: "var(--text-inverse)" }}
          >
            Review <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pipeline */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Pipeline Stages</h3>
              <Link href="/leads" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
                Kanban <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stages.map((s) => {
                const count = contacts.filter((c) => c.stage === s.stage).length;
                return (
                  <div key={s.stage} className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                    </div>
                    <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Clock className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>No recent activities.</p>
              ) : (
                recentActivities.map((act) => {
                  const contact = contacts.find((c) => c.id === act.contact_id);
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-sm p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "var(--indigo-light)", color: "var(--indigo)" }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {contact ? contact.full_name : "General"}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{act.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Meetings + Tasks */}
        <div className="space-y-6">
          {/* Today's Meetings */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Calendar className="w-4 h-4" style={{ color: "var(--accent-text)" }} /> Today
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
                {todayMeetings.length}
              </span>
            </div>
            {todayMeetings.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No meetings today.</p>
            ) : (
              <div className="space-y-2">
                {todayMeetings.map((m) => {
                  const contact = contacts.find((c) => c.id === m.contact_id);
                  const time = new Date(m.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={m.id} className="p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>{time}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                          {m.mode}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</p>
                      {contact && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>With: {contact.full_name}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Open Tasks */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <CheckSquare className="w-4 h-4" style={{ color: "var(--purple)" }} /> Open Tasks
              </h3>
              <Link href="/tasks" className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>View All</Link>
            </div>
            <div className="space-y-2">
              {openTasks.length === 0 && (
                <p className="text-xs py-4 text-center" style={{ color: "var(--text-muted)" }}>No open tasks.</p>
              )}
              {openTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: task.priority === "high" ? "var(--red)" : task.priority === "medium" ? "var(--amber)" : "var(--blue)",
                      }}
                    />
                    <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{task.title}</span>
                  </div>
                  {task.due_at && (
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                      {new Date(task.due_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
