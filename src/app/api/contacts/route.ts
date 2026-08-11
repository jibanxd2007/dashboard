import { NextRequest, NextResponse } from "next/server";
import { getContacts, createContact } from "@/lib/queries/contacts";
import { createActivity } from "@/lib/queries/activities";
import { notify } from "@/lib/notify";

export async function GET() {
  const contacts = await getContacts();
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.full_name || !body.phone) {
      return NextResponse.json({ error: "Full Name and Phone are required" }, { status: 400 });
    }

    const contact = await createContact({
      full_name: body.full_name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone,
      type: body.type || "lead",
      stage: body.stage || "new",
      source: body.source || "manual",
      campaign: body.campaign || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      deal_value: Number(body.deal_value) || 0,
      tags: Array.isArray(body.tags) ? body.tags : body.tags ? body.tags.split(",").map((t: string) => t.trim()) : [],
      notes: body.notes || null,
      last_contacted_at: body.last_contacted_at || null,
    });

    // Log creation activity
    await createActivity({
      contact_id: contact.id,
      type: "created",
      body: `Contact ${contact.full_name} created via ${contact.source}.`,
      meta: { source: contact.source },
    });

    // Trigger WhatsApp notification for new lead if requested
    if (contact.type === "lead") {
      const msg = `🚨 *NEW LEAD RECEIVED!*\n\n👤 *Name:* ${contact.full_name}\n🏢 *Company:* ${contact.company || "N/A"}\n📞 *Phone:* ${contact.phone}\n💰 *Value:* ₹${contact.deal_value}\n📌 *Source:* ${contact.source}`;
      await notify("new_lead", `new_lead_${contact.id}`, msg, contact.id);
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create contact" }, { status: 500 });
  }
}
