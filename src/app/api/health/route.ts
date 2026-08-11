import { NextResponse } from "next/server";
import { getDatabaseStatus } from "@/lib/supabase/server";

/** Reports which integrations are configured, so the UI can warn about gaps. */
export async function GET() {
  const db = getDatabaseStatus();

  return NextResponse.json({
    databaseConfigured: db.ok,
    databaseReason: db.ok ? null : db.reason,
    databaseMessage: db.ok ? null : db.message,
    aiConfigured: Boolean(
      process.env.OPENAI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GROQ_API_KEY
    ),
  });
}
