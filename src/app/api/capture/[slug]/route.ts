import { NextRequest, NextResponse } from "next/server";
import { getCaptureLinkBySlug } from "@/lib/queries/captureLinks";
import { createContact } from "@/lib/queries/contacts";
import { createActivity } from "@/lib/queries/activities";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await req.json();

    if (!body.full_name || !body.phone) {
      return NextResponse.json({ error: "Full Name and Phone are required" }, { status: 400 });
    }

    // Lookup slug configuration
    const captureLink = await getCaptureLinkBySlug(slug);
    const source = captureLink?.source || "instagram";
    const campaign = captureLink?.campaign || slug;

    // Create new lead
    const contact = await createContact({
      full_name: body.full_name,
      company: body.company || null,
      email: body.email || null,
      phone: body.phone,
      type: "lead",
      stage: "new",
      source,
      campaign,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      deal_value: Number(body.deal_value) || 0,
      tags: ["Inbound Lead", slug],
      notes: body.notes || null,
      last_contacted_at: null,
    });

    // Log activity
    await createActivity({
      contact_id: contact.id,
      type: "created",
      body: `Inbound lead captured via public link: ${captureLink ? captureLink.label : slug}. Note: ${body.notes || 'None'}`,
      meta: { slug, source, campaign },
    });

    // Notify founder via WhatsApp
    const msg = `🚀 *NEW INBOUND LEAD CAPTURED!*\n\n📌 *Link:* ${captureLink ? captureLink.label : slug}\n👤 *Name:* ${contact.full_name}\n🏢 *Company:* ${contact.company || "N/A"}\n📞 *Phone:* ${contact.phone}\n📧 *Email:* ${contact.email || "N/A"}\n📝 *Note:* ${body.notes || "None"}`;
    await notify("new_lead", `lead_capture_${contact.id}`, msg, contact.id);

    return NextResponse.json({ success: true, contact_id: contact.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to capture lead" }, { status: 500 });
  }
}
