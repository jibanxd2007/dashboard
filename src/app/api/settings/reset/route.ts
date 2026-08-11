import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mockStore";
import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";

/**
 * Destructive: erases every contact, task, meeting, activity and capture link.
 * Settings and notification credentials are preserved.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, confirm } = await req.json();

    if (action !== "clear") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (confirm !== "ERASE") {
      return NextResponse.json(
        { error: "Confirmation required. Send { action: \"clear\", confirm: \"ERASE\" }." },
        { status: 400 }
      );
    }

    mockDb.clearAll();

    if (isDatabaseConfigured()) {
      const supabase: any = await getSupabaseServerClient();
      // Child rows first — contacts are referenced by the others.
      for (const table of ["activities", "tasks", "meetings", "capture_links", "contacts"]) {
        const { error } = await supabase.from(table).delete().neq("id", "0");
        if (error) {
          return NextResponse.json(
            { error: `Failed to clear ${table}: ${error.message}` },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: "All records erased." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to erase data" }, { status: 500 });
  }
}
