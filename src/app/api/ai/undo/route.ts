import { NextRequest, NextResponse } from "next/server";
import { undoAgentAction, getRecentAgentActions } from "@/lib/ai/actions";

export async function POST(req: NextRequest) {
  try {
    const { actionId } = await req.json();
    if (!actionId) {
      return NextResponse.json({ success: false, error: "actionId is required" }, { status: 400 });
    }

    const result = await undoAgentAction(actionId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to undo action" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const actions = await getRecentAgentActions();
    return NextResponse.json({ success: true, actions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch agent actions" }, { status: 500 });
  }
}
