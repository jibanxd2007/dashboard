import { NextRequest, NextResponse } from "next/server";
import { getTasks } from "@/lib/queries/tasks";
import { getMeetings } from "@/lib/queries/meetings";
import { getContacts } from "@/lib/queries/contacts";
import { getSettings } from "@/lib/queries/settings";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const secret = searchParams.get("secret") || (authHeader ? authHeader.replace("Bearer ", "") : "");
    const expectedSecret = process.env.CRON_SECRET || "crm_cron_secret_32_chars_random_val";

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const now = new Date();
    const settings = await getSettings();
    const [tasks, meetings, contacts] = await Promise.all([
      getTasks(),
      getMeetings(),
      getContacts(),
    ]);

    let sentCount = 0;

    // 1. Check Tasks due within 1 hour
    const openTasks = tasks.filter((t) => t.status === "open" && t.due_at && !t.reminded_at);
    for (const task of openTasks) {
      const dueTime = new Date(task.due_at!);
      const diffMinutes = (dueTime.getTime() - now.getTime()) / (1000 * 60);

      if (diffMinutes > 0 && diffMinutes <= 60) {
        const contact = contacts.find((c) => c.id === task.contact_id);
        const msg = `⏰ *TASK DUE SOON!*\n\n📋 *Title:* ${task.title}\n🚨 *Priority:* ${task.priority.toUpperCase()}\n⏰ *Due At:* ${dueTime.toLocaleTimeString()}\n${contact ? `👤 *Contact:* ${contact.full_name}` : ""}`;
        
        const res = await notify("task_due", `task_due_${task.id}`, msg, task.id);
        if (res.sent) sentCount++;
      }
    }

    // 2. Check Meetings starting within 30 mins
    const upcomingMeetings = meetings.filter((m) => m.status === "scheduled" && !m.reminded_at);
    for (const meeting of upcomingMeetings) {
      const startTime = new Date(meeting.starts_at);
      const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

      if (diffMinutes > 0 && diffMinutes <= 30) {
        const contact = contacts.find((c) => c.id === meeting.contact_id);
        const msg = `📅 *MEETING STARTING SOON!*\n\n📌 *Title:* ${meeting.title}\n⏰ *Time:* ${startTime.toLocaleTimeString()}\n🎥 *Mode:* ${meeting.mode.toUpperCase()}\n🔗 *Link/Loc:* ${meeting.location_or_link || "N/A"}\n${contact ? `👤 *With:* ${contact.full_name}` : ""}`;

        const res = await notify("meeting_soon", `meeting_soon_${meeting.id}`, msg, meeting.id);
        if (res.sent) sentCount++;
      }
    }

    // 3. Daily Digest Check (Runs if current hour matches digest hour)
    if (now.getHours() === (settings.digest_hour ?? 8)) {
      const todayStr = now.toISOString().slice(0, 10);
      const openTasksCount = tasks.filter((t) => t.status === "open").length;
      const todayMeetingsCount = meetings.filter((m) => {
        const d = new Date(m.starts_at);
        return d.toISOString().slice(0, 10) === todayStr && m.status !== "cancelled";
      }).length;
      const newLeadsCount = contacts.filter((c) => c.stage === "new").length;

      const digestMsg = `🌅 *SOLOCRM DAILY BRIEFING*\n\n📊 *New Leads:* ${newLeadsCount}\n📅 *Today's Meetings:* ${todayMeetingsCount}\n📋 *Open Tasks:* ${openTasksCount}\n\nHave a productive day! 🚀`;

      const res = await notify("daily_digest", `daily_digest_${todayStr}`, digestMsg);
      if (res.sent) sentCount++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      notifications_sent: sentCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Cron execution failed" }, { status: 500 });
  }
}
