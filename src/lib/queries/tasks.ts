import { mockDb, TaskItem } from "@/lib/mockStore";
import { TaskStatus } from "@/lib/database.types";
import { withDb } from "@/lib/queries/db";

export async function getTasks(): Promise<TaskItem[]> {
  const { handled, data } = await withDb<TaskItem[]>((s) =>
    s.from("tasks").select("*").order("created_at", { ascending: false })
  );
  if (handled) return data ?? [];
  return [...mockDb.tasks];
}

export async function toggleTaskStatus(id: string, currentStatus: TaskStatus): Promise<TaskItem | null> {
  const newStatus: TaskStatus = currentStatus === "open" ? "done" : "open";
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;

  const { handled, data } = await withDb<TaskItem>((s) =>
    s.from("tasks").update({ status: newStatus, completed_at }).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const task = mockDb.tasks.find((t: TaskItem) => t.id === id);
  if (task) {
    task.status = newStatus;
    task.completed_at = completed_at;
    return { ...task };
  }
  return null;
}

export async function createTask(
  taskData: Omit<TaskItem, "id" | "created_at" | "completed_at" | "reminded_at">
): Promise<TaskItem> {
  const newTask: TaskItem = {
    id: crypto.randomUUID(),
    ...taskData,
    completed_at: null,
    reminded_at: null,
    created_at: new Date().toISOString(),
  };

  const { handled, data } = await withDb<TaskItem>((s) =>
    s.from("tasks").insert(newTask).select().single()
  );
  if (handled && data) return data;

  mockDb.tasks.unshift(newTask);
  return newTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  const { handled } = await withDb((s) => s.from("tasks").delete().eq("id", id));
  if (handled) return true;

  const initialLen = mockDb.tasks.length;
  mockDb.tasks = mockDb.tasks.filter((t: TaskItem) => t.id !== id);
  return mockDb.tasks.length < initialLen;
}

export async function updateTaskFields(
  id: string,
  fields: Partial<Omit<TaskItem, "id" | "created_at">>
): Promise<TaskItem | null> {
  const { handled, data } = await withDb<TaskItem>((s) =>
    s.from("tasks").update(fields).eq("id", id).select().maybeSingle()
  );
  if (handled) return data;

  const index = mockDb.tasks.findIndex((t: TaskItem) => t.id === id);
  if (index !== -1) {
    mockDb.tasks[index] = { ...mockDb.tasks[index], ...fields };
    return mockDb.tasks[index];
  }
  return null;
}
