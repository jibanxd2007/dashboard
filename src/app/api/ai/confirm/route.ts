import { NextRequest, NextResponse } from "next/server";
import { executeConfirmationProposalAction } from "@/lib/ai/actions";

export async function POST(req: NextRequest) {
  try {
    const { proposalType, params } = await req.json();

    if (!proposalType) {
      return NextResponse.json({ error: "Missing proposalType" }, { status: 400 });
    }

    const result = await executeConfirmationProposalAction(proposalType, params);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Proposal execution error:", error);
    return NextResponse.json(
      { error: "CONFIRMATION_ERROR", message: error.message || "Failed to execute proposal" },
      { status: 500 }
    );
  }
}
