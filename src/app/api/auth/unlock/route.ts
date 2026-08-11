import { NextRequest, NextResponse } from "next/server";
import { verifyPin, setAuthSession, isPinConfigured } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ success: false, message: "PIN is required" }, { status: 400 });
    }

    if (!isPinConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "APP_ACCESS_PIN is not set on this deployment. Add it in your hosting environment settings, then redeploy.",
        },
        { status: 503 }
      );
    }

    if (verifyPin(pin)) {
      await setAuthSession(pin);
      return NextResponse.json({ success: true, message: "Unlocked successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Invalid PIN code" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: 500 });
  }
}
