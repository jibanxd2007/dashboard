import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";
import { mockDb, TaskItem } from "@/lib/mockStore";
import { TaskPriority, TaskStatus } from "@/lib/database.types";

export async function getTasks(): Promise<TaskItem[]> {
  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data as TaskItem[];
    } catch (e) {
      console.warn("Supabase query failed, falling back to mockDb:", e);
    }
  }
  return [...mockDb.tasks];
}

export async function toggleTaskStatus(id: string, currentStatus: TaskStatus): Promise<TaskItem | null> {
  const newStatus: TaskStatus = currentStatus === "open" ? "done" : "open";
  const completed_at = newStatus === "done" ? new Date().toISOString() : null;

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("tasks")
        .update({ status: newStatus, completed_at } as any)
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as TaskItem;
    } catch (e) {
      console.warn("Supabase update failed, falling back to mockDb:", e);
    }
  }

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
  const now = new Date().toISOString();
  const id = "t_" + crypto.randomUUID();
  const newTask: TaskItem = {
    id,
    ...taskData,
    completed_at: null,
    reminded_at: null,
    created_at: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const supabase: any = await getSupabaseServerClient();
      const { data, error } = await supabase
        .from("tasks")
        .insert(newTask as any)
        .select()
        .single();
      if (!error && data) return data as TaskItem;
    } catch (e) {
      console.warn("Supabase insert failed, falling back to mockDb:", e);
    }
  }

  mockDb.tasks.unshift(newTask);
  return newTask;
}
