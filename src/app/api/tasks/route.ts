import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "@/lib/queries/tasks";
import { notify } from "@/lib/notify";

export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await createTask({
      contact_id: body.contact_id || null,
      title: body.title,
      description: body.description || null,
      due_at: body.due_at || null,
      remind_at: body.remind_at || null,
      priority: body.priority || "medium",
      status: "open",
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
