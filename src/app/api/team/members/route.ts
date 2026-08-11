import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, createTeamMember } from "@/lib/queries/team";
import { TeamRole, TeamMemberStatus } from "@/lib/database.types";

const ROLES: TeamRole[] = ["owner", "manager", "member"];
const STATUSES: TeamMemberStatus[] = ["active", "inactive"];

export async function GET() {
  try {
    return NextResponse.json(await getTeamMembers());
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load team" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = (body.full_name || "").trim();
    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const member = await createTeamMember({
      full_name: fullName,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      role: ROLES.includes(body.role) ? body.role : "member",
      title: body.title?.trim() || null,
      status: STATUSES.includes(body.status) ? body.status : "active",
      joined_at: body.joined_at || null,
      notes: body.notes?.trim() || null,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 });
  }
}
