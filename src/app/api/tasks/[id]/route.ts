import { NextRequest, NextResponse } from "next/server";
import { toggleTaskStatus } from "@/lib/queries/tasks";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    // body.status is the task's status *before* the toggle; toggleTaskStatus flips it.
    const currentStatus = body.status === "done" ? "done" : "open";
    const updated = await toggleTaskStatus(id, currentStatus);
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}
