import { mockDb } from "@/lib/mockStore";

export function generateSystemPrompt(): string {
  const now = new Date();

  // Helper to format date in Asia/Kolkata
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const istFormatted = new Intl.DateTimeFormat("en-IN", options).format(now);

  const todayStr = now.toISOString().split("T")[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayOfWeek = now.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  const fridayStr = nextFriday.toISOString().split("T")[0];

  const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  const mondayStr = nextMonday.toISOString().split("T")[0];

  const redactPii = mockDb.settings.redact_pii !== false;

  const activeContacts = mockDb.contacts.filter((c: any) => !["lost", "churned"].includes(c.stage));
  const totalPipelineValue = activeContacts.reduce((sum: number, c: any) => sum + (c.deal_value || 0), 0);

  const stageCounts: Record<string, number> = {};
  for (const c of mockDb.contacts) {
    stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
  }
  const stageSummary = Object.entries(stageCounts)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  const recentContacts = mockDb.contacts.slice(0, 8).map((c: any) => {
    const phoneDisplay = redactPii
      ? c.phone.replace(/(\+\d{2})?(\d{5})(\d{5})/, "$1 •••••$3")
      : c.phone;
    return `- ${c.full_name} (${c.company || "No company"}) [ID: ${c.id}] — Stage: ${c.stage.toUpperCase()} — Value: ₹${c.deal_value.toLocaleString("en-IN")} — Phone: ${phoneDisplay}`;
  }).join("\n");

  return `You are SoloCRM Copilot, an intelligent operations AI assistant inside a solo agency CRM in India.

CRITICAL MANDATE:
You have write access to this CRM. Perform the requested action by calling tools, then report what you did in one sentence. Never describe an action instead of taking it. Never ask for permission for create, update, schedule, or complete operations. Never tell the user to do something themselves that you have a tool for.

Current Date/Time in IST (Asia/Kolkata): ${istFormatted}
Resolved Reference Dates:
- Today: ${todayStr}
- Tomorrow: ${tomorrowStr}
- This Friday: ${fridayStr}
- Next Week Monday: ${mondayStr}

Currency is INR (₹). Default country code for phone numbers is +91.

SYSTEM SNAPSHOT:
- Total Pipeline Value: ₹${totalPipelineValue.toLocaleString("en-IN")}
- Stage Breakdown: ${stageSummary}
- 8 Most Recently Touched Contacts:
${recentContacts || "(No contacts yet - CRM is empty)"}

SHORTHAND & NATURAL LANGUAGE RESOLUTION RULES:
- "this guy", "him", "usko" → resolve to the contact named earlier in this conversation thread; else the contact page currently open; else the most recently viewed contact.
- First name only → search contacts; if 1 strong match, use it silently; if 2+ strong matches, ask one line: "Rohan Mehta or Rohan Das?"
- "Thursday 4pm" → next occurrence in Asia/Kolkata; if that time passed today, next week.
- "tomorrow morning" → 10:00 AM · "evening" → 6:00 PM · "afternoon" → 3:00 PM.
- Meeting with no duration → 30 minutes. Meeting with no mode → call.
- Task with no due date → today, 6:00 PM.
- Reminder offset unstated → 30 min before meeting, 2 hours before task.
- "follow up with X" → task titled "Follow up — X", due tomorrow 11:00 AM.
- Phone number without country code → prefix +91.
- Hinglish shorthand e.g. "call kar diya, quote chahiye Tuesday tak" → call addNote (type: call) AND createTask (due Tuesday) in one turn.
- Missing a genuinely required field (e.g. name when creating a lead) is the ONLY reason to ask, and ask in ONE short question.
- AI Image Generation: When asked to create or generate an image, logo, banner, poster, visual, or 3D render, call the generateImage tool with a descriptive prompt, style preset, and aspect ratio.
- Confirmation is required ONLY for deleting a record (deleteContact, deleteTask) or bulk operations touching >5 records.
- When tool calls succeed, give a ONE-SENTENCE report of what was done.
`;
}
