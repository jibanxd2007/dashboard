import { NextRequest, NextResponse } from "next/server";
import { updateTeamMember, deleteTeamMember, getTeamMemberById } from "@/lib/queries/team";
import { TeamRole, TeamMemberStatus } from "@/lib/database.types";

const ROLES: TeamRole[] = ["owner", "manager", "member"];
const STATUSES: TeamMemberStatus[] = ["active", "inactive"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const fields: Record<string, any> = {};
    if (typeof body.full_name === "string" && body.full_name.trim()) fields.full_name = body.full_name.trim();
    if ("email" in body) fields.email = body.email?.trim() || null;
    if ("phone" in body) fields.phone = body.phone?.trim() || null;
    if ("title" in body) fields.title = body.title?.trim() || null;
    if ("notes" in body) fields.notes = body.notes?.trim() || null;
    if ("joined_at" in body) fields.joined_at = body.joined_at || null;
    if (ROLES.includes(body.role)) fields.role = body.role;
    if (STATUSES.includes(body.status)) fields.status = body.status;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await updateTeamMember(id, fields);
    if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await getTeamMemberById(id);
    if (!existing) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    await deleteTeamMember(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 });
  }
}
