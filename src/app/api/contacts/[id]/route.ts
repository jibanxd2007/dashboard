import { NextRequest, NextResponse } from "next/server";
import { getContactById, updateContactFields, deleteContact } from "@/lib/queries/contacts";
import { createActivity } from "@/lib/queries/activities";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await getContactById(id);
    if (!existing) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

    const updated = await updateContactFields(id, body);

    // If stage changed, log activity
    if (body.stage && body.stage !== existing.stage) {
      await createActivity({
        contact_id: id,
        type: "stage_change",
        body: `Moved stage from ${existing.stage.toUpperCase()} to ${body.stage.toUpperCase()}.`,
        meta: { old_stage: existing.stage, new_stage: body.stage },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const success = await deleteContact(id);
    if (!success) return NextResponse.json({ error: "Failed to delete contact" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
