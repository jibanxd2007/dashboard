import { NextRequest, NextResponse } from "next/server";
import { getCaptureLinks, createCaptureLink } from "@/lib/queries/captureLinks";

export async function GET() {
  const links = await getCaptureLinks();
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.slug || !body.label) {
      return NextResponse.json({ error: "Slug and label are required" }, { status: 400 });
    }

    const link = await createCaptureLink({
      slug: body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      label: body.label,
      source: body.source || "instagram",
      campaign: body.campaign || null,
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create capture link" }, { status: 500 });
  }
}
