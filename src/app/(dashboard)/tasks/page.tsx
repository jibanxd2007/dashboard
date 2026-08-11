"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  User,
  X,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/Dialog";
import { TaskItem, ContactItem } from "@/lib/mockStore";
import { TaskPriority } from "@/lib/database.types";
import { QuickVoiceNote } from "@/components/copilot/QuickVoiceNote";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [statusTab, setStatusTab] = useState<"open" | "completed" | "all">("open");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    contact_id: "",
    due_at: "",
    priority: "medium" as TaskPriority,
    description: "",
  });

  const fetchData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/contacts"),
      ]);
      const tData = await tRes.json();
      const cData = await cRes.json();
      setTasks(Array.isArray(tData) ? tData : []);
      setContacts(Array.isArray(cData) ? cData : []);
    } catch (e) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTask = async (task: TaskItem) => {
    const newStatus = task.status === "open" ? "done" : "open";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: task.status }),
      });
      if (res.ok) {
        toast.success(newStatus === "done" ? "Task completed! 🎉" : "Task re-opened");
      } else {
        toast.error("Failed to update task");
        fetchData();
      }
    } catch (e) {
      toast.error("Network error");
      fetchData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingTask) return; // guard against double submit
    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSavingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });

      if (res.ok) {
        toast.success("Task created!");
        setIsModalOpen(false);
        setTaskForm({
          title: "",
          contact_id: "",
          due_at: "",
          priority: "medium",
          description: "",
        });
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to create task");
      }
    } catch (e) {
      toast.error("Could not reach the server. The task was not saved.");
    } finally {
      setSavingTask(false);
    }
  };

  const now = new Date();

  const filteredTasks = tasks.filter((t) => {
    if (!t) return false;
    const taskTitle = (t.title || "").toLowerCase();
    const q = (searchQuery || "").toLowerCase();
    const matchesSearch = taskTitle.includes(q);
    const matchesPriority = selectedPriority === "all" || t.priority === selectedPriority;
    const matchesStatus =
      statusTab === "all"
        ? true
        : statusTab === "open"
        ? t.status === "open"
        : t.status === "done";
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const overdueTasks = filteredTasks.filter(
    (t) => t.status === "open" && t.due_at && new Date(t.due_at) < now
  );

  const todayTasks = filteredTasks.filter((t) => {
    if (t.status !== "open" || !t.due_at) return false;
    const d = new Date(t.due_at);
    return (
      d >= now &&
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const upcomingTasks = filteredTasks.filter((t) => {
    if (t.status !== "open" || !t.due_at) return false;
    const d = new Date(t.due_at);
    return d > now && d.getDate() !== now.getDate();
  });

  const noDueTasks = filteredTasks.filter((t) => t.status === "open" && !t.due_at);
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Track follow-ups, deadlines, and daily todos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickVoiceNote onSuccess={fetchData} />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center p-1 rounded-lg border w-full sm:w-auto" style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
          {(["open", "completed", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className="flex-1 sm:flex-none px-3.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider transition-colors"
              style={{
                background: statusTab === tab ? "var(--accent-light)" : "transparent",
                color: statusTab === tab ? "var(--accent-text)" : "var(--text-secondary)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none"
              style={inputStyle}
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={inputStyle}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task Sections */}
      {loading ? (
        <div className="py-20 text-center" style={{ color: "var(--text-muted)" }}>Loading tasks...</div>
      ) : (
        <div className="space-y-5">
          {overdueTasks.length > 0 && (
            <TaskSection
              title="Overdue"
              badgeColor="var(--red-light)"
              textColor="var(--red)"
              icon={AlertCircle}
              tasks={overdueTasks}
              contacts={contacts}
              onToggle={handleToggleTask}
            />
          )}

          {todayTasks.length > 0 && (
            <TaskSection
              title="Due Today"
              badgeColor="var(--accent-light)"
              textColor="var(--accent-text)"
              icon={Clock}
              tasks={todayTasks}
              contacts={contacts}
              onToggle={handleToggleTask}
            />
          )}

          {upcomingTasks.length > 0 && (
            <TaskSection
              title="Upcoming"
              badgeColor="var(--indigo-light)"
              textColor="var(--indigo)"
              icon={Calendar}
              tasks={upcomingTasks}
              contacts={contacts}
              onToggle={handleToggleTask}
            />
          )}

          {noDueTasks.length > 0 && (
            <TaskSection
              title="No Due Date"
              badgeColor="var(--bg-secondary)"
              textColor="var(--text-secondary)"
              icon={CheckSquare}
              tasks={noDueTasks}
              contacts={contacts}
              onToggle={handleToggleTask}
            />
          )}

          {doneTasks.length > 0 && statusTab !== "open" && (
            <TaskSection
              title="Completed"
              badgeColor="var(--purple-light)"
              textColor="var(--purple)"
              icon={CheckCircle2}
              tasks={doneTasks}
              contacts={contacts}
              onToggle={handleToggleTask}
            />
          )}

          {filteredTasks.length === 0 && (
            <div className="card p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No tasks found.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        title="Create Task"
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        busy={savingTask}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={savingTask} className="px-4 py-2 rounded-lg text-xs font-medium min-h-[44px] disabled:opacity-50" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>Cancel</button>
            <button type="submit" disabled={savingTask} className="px-4 py-2 rounded-lg text-xs font-medium min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>{savingTask ? "Saving..." : "Save Task"}</button>
          </>
        }
      >
        <></>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Follow up with client..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Contact</label>
                  <select
                    value={taskForm.contact_id}
                    onChange={(e) => setTaskForm({ ...taskForm, contact_id: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">None (General)</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={taskForm.due_at}
                  onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

      </Dialog>
    </div>
  );
}

function TaskSection({
  title,
  badgeColor,
  textColor,
  icon: Icon,
  tasks,
  contacts,
  onToggle,
}: {
  title: string;
  badgeColor: string;
  textColor: string;
  icon: any;
  tasks: TaskItem[];
  contacts: ContactItem[];
  onToggle: (task: TaskItem) => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--border-secondary)" }}>
        <Icon className="w-4 h-4" style={{ color: textColor }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <span className="px-2 py-0.5 text-xs font-bold rounded-md" style={{ background: badgeColor, color: textColor }}>
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const contact = contacts.find((c) => c.id === task.contact_id);
          const isDone = task.status === "done";

          return (
            <div
              key={task.id}
              className="flex items-start justify-between p-3 rounded-lg border transition-colors"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-secondary)",
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => onToggle(task)}
                  className="mt-0.5 shrink-0 transition-colors"
                  style={{ color: isDone ? "var(--text-muted)" : "var(--accent-text)" }}
                >
                  {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium ${isDone ? "line-through" : ""}`} style={{ color: isDone ? "var(--text-muted)" : "var(--text-primary)" }}>
                      {task.title}
                    </span>
                    <span
                      className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded"
                      style={{
                        background: task.priority === "high" ? "var(--red-light)" : task.priority === "medium" ? "var(--amber-light)" : "var(--blue-light)",
                        color: task.priority === "high" ? "var(--red)" : task.priority === "medium" ? "var(--amber)" : "var(--blue)",
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{task.description}</p>
                  )}

                  {contact && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--indigo)" }}>
                      <User className="w-3 h-3" /> {contact.full_name}
                    </p>
                  )}
                </div>
              </div>

              {task.due_at && (
                <span className="text-xs font-mono shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>
                  {new Date(task.due_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
