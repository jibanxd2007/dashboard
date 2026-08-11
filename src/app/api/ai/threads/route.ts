import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mockStore";

export async function GET() {
  // Returns last 20 threads
  const threads = mockDb.aiThreads.slice(0, 20);
  return NextResponse.json({ threads });
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const newThread = {
      id: `th_${Math.random().toString(36).substring(2, 10)}`,
      title: title || "New Conversation",
      created_at: new Date().toISOString(),
    };
    mockDb.aiThreads.unshift(newThread);
    // Keep max 20 threads
    if (mockDb.aiThreads.length > 20) {
      mockDb.aiThreads = mockDb.aiThreads.slice(0, 20);
    }
    return NextResponse.json(newThread);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
