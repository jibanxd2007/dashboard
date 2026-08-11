import { NextRequest, NextResponse } from "next/server";
import { getActivitiesByContactId, createActivity } from "@/lib/queries/activities";
import { updateContactFields } from "@/lib/queries/contacts";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contact_id");
  if (!contactId) return NextResponse.json({ error: "contact_id is required" }, { status: 400 });

  const activities = await getActivitiesByContactId(contactId);
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.contact_id || !body.body || !body.type) {
      return NextResponse.json({ error: "contact_id, body, and type are required" }, { status: 400 });
    }

    const activity = await createActivity({
      contact_id: body.contact_id,
      type: body.type,
      body: body.body,
      meta: body.meta || {},
    });

    // Update last_contacted_at on contact if activity is call/whatsapp/email/meeting
    if (["call", "whatsapp", "email", "meeting"].includes(body.type)) {
      await updateContactFields(body.contact_id, {
        last_contacted_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create activity" }, { status: 500 });
  }
}
