import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mockStore";
import { getSupabaseServerClient, isDatabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    if (action === "clear") {
      mockDb.clearDemoData();

      if (isDatabaseConfigured()) {
        try {
          const supabase: any = await getSupabaseServerClient();
          await supabase.from("activities").delete().neq("id", "0");
          await supabase.from("tasks").delete().neq("id", "0");
          await supabase.from("meetings").delete().neq("id", "0");
          await supabase.from("capture_links").delete().neq("id", "0");
          await supabase.from("contacts").delete().neq("id", "0");
        } catch (e) {
          console.warn("Supabase database purge warning:", e);
        }
      }

      return NextResponse.json({ success: true, message: "Demo showcase data cleared." });
    }

    if (action === "seed") {
      mockDb.resetToDemoData();
      return NextResponse.json({ success: true, message: "Demo showcase data restored." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to reset data" }, { status: 500 });
  }
}
