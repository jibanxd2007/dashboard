import { NextRequest, NextResponse } from "next/server";
import { toggleTaskStatus } from "@/lib/queries/tasks";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const currentStatus = body.status === "done" ? "open" : "done"; // current status before toggle
    const updated = await toggleTaskStatus(id, currentStatus);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}
