import { NextResponse } from "next/server";
import { mockDb } from "@/lib/mockStore";
import { AIUsageItem } from "@/lib/mockStore";

/** Aggregate AI token usage for the current calendar month. */
export async function GET() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thisMonth = mockDb.aiUsage.filter(
    (u: AIUsageItem) => new Date(u.created_at) >= startOfMonth
  );

  return NextResponse.json({
    totalInput: thisMonth.reduce((sum: number, u: AIUsageItem) => sum + (u.input_tokens || 0), 0),
    totalOutput: thisMonth.reduce((sum: number, u: AIUsageItem) => sum + (u.output_tokens || 0), 0),
    calls: thisMonth.length,
  });
}
