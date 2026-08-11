import { mockDb, ContactItem, TaskItem, AgentActionItem } from "@/lib/mockStore";
import { ContactStage, ContactSource, TaskPriority, MeetingMode } from "@/lib/database.types";
import { sendWhatsAppNotification } from "@/lib/notify/whatsapp";
import {
  getContacts,
  getContactById,
  createContact,
  updateContactFields,
  deleteContact,
  bulkUpdateStage,
} from "@/lib/queries/contacts";
import { getTasks, createTask, deleteTask, updateTaskFields } from "@/lib/queries/tasks";
import { getMeetings, createMeeting, deleteMeeting } from "@/lib/queries/meetings";
import { getActivities, logActivity, deleteActivity } from "@/lib/queries/activities";
import { getSettings } from "@/lib/queries/settings";

// --- AGENT ACTION UNDO ENGINE ---
//
// The undo log itself lives in memory: it only holds short-lived undo tokens
// and a 7-day audit trail, so losing it on restart costs the ability to undo,
// not any CRM data. The inverse operations below run against the real
// database via the query layer.

export async function recordAgentAction(toolName: string, payload: any, inverse: any) {
  const action: AgentActionItem = {
    id: crypto.randomUUID(),
    tool: toolName,
    payload,
    inverse,
    undone_at: null,
    created_at: new Date().toISOString(),
  };
  mockDb.agentActions.unshift(action);
  return action.id;
}

export async function undoAgentAction(actionId: string) {
  const action = mockDb.agentActions.find((a: AgentActionItem) => a.id === actionId);
  if (!action) return { success: false, error: "Action token not found" };
  if (action.undone_at) return { success: false, error: "Action has already been undone" };

  const { tool, inverse } = action;

  try {
    switch (inverse.type) {
      case "delete_contact":
        await deleteContact(inverse.id);
        break;
      case "delete_task":
        await deleteTask(inverse.id);
        break;
      case "delete_meeting":
        await deleteMeeting(inverse.id);
        break;
      case "delete_activity":
        await deleteActivity(inverse.id);
        break;
      case "restore_contact":
        await updateContactFields(inverse.id, inverse.previousState);
        break;
      case "restore_task":
        await updateTaskFields(inverse.id, inverse.previousState);
        break;
      default:
        return { success: false, error: `Unknown inverse action type: ${inverse.type}` };
    }

    action.undone_at = new Date().toISOString();
    return { success: true, message: `Successfully undone ${tool}` };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to undo action" };
  }
}

export async function getRecentAgentActions() {
  const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
  return mockDb.agentActions.filter(
    (a: AgentActionItem) => new Date(a.created_at).getTime() >= sevenDaysAgo
  );
}

// --- READ ACTIONS ---

export async function searchContactsAction(query: string) {
  const q = query.toLowerCase().trim();
  const contacts = await getContacts();
  return contacts
    .filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.tags || []).some((t: string) => t.toLowerCase().includes(q))
    )
    .slice(0, 10);
}

export async function getContactAction(idOrName: string) {
  let contact = await getContactById(idOrName).catch(() => null);
  if (!contact) {
    const matches = await searchContactsAction(idOrName);
    contact = matches[0] || null;
  }
  if (!contact) return null;

  const [activities, tasks] = await Promise.all([getActivities(contact.id), getTasks()]);

  return {
    contact,
    activities: activities.slice(0, 5),
    openTasks: tasks.filter((t) => t.contact_id === contact!.id && t.status === "open"),
  };
}

const isSameDay = (a: Date, b: Date) =>
  a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

export async function getTodayAgendaAction() {
  const now = new Date();
  const [tasks, meetings] = await Promise.all([getTasks(), getMeetings()]);

  return {
    todayTasks: tasks.filter(
      (t) => t.status === "open" && t.due_at && isSameDay(new Date(t.due_at), now)
    ),
    overdueTasks: tasks.filter((t) => t.status === "open" && t.due_at && new Date(t.due_at) < now),
    todayMeetings: meetings.filter(
      (m) => m.status !== "cancelled" && isSameDay(new Date(m.starts_at), now)
    ),
  };
}

export async function getPipelineSummaryAction(sourceFilter?: string) {
  let contacts = await getContacts();
  if (sourceFilter && sourceFilter !== "all") {
    contacts = contacts.filter((c) => c.source === sourceFilter);
  }

  const stages: Record<string, { count: number; value: number }> = {};
  for (const c of contacts) {
    if (!stages[c.stage]) stages[c.stage] = { count: 0, value: 0 };
    stages[c.stage].count += 1;
    stages[c.stage].value += c.deal_value || 0;
  }

  const totalValue = contacts
    .filter((c) => !["lost", "churned"].includes(c.stage))
    .reduce((sum, c) => sum + (c.deal_value || 0), 0);

  return { totalValue, totalContacts: contacts.length, stages };
}

export async function getLeadsByFilterAction(filters: {
  source?: string;
  stage?: string;
  tag?: string;
  staleOnly?: boolean;
}) {
  const now = new Date();
  const [contacts, settings] = await Promise.all([getContacts(), getSettings()]);
  const staleThresholdMs = (settings.stale_lead_days || 7) * 86400 * 1000;

  return contacts.filter((c) => {
    if (filters.source && filters.source !== "all" && c.source !== filters.source) return false;
    if (filters.stage && filters.stage !== "all" && c.stage !== filters.stage) return false;
    if (filters.tag && !(c.tags || []).includes(filters.tag)) return false;
    if (filters.staleOnly) {
      if (["won", "lost"].includes(c.stage)) return false;
      const lastContact = c.last_contacted_at || c.created_at;
      if (now.getTime() - new Date(lastContact).getTime() <= staleThresholdMs) return false;
    }
    return true;
  });
}

// --- WRITE ACTIONS (execute immediately, store inverse for Undo) ---

export async function createLeadAction(data: {
  full_name: string;
  phone: string;
  company?: string;
  email?: string;
  source?: ContactSource;
  stage?: ContactStage;
  deal_value?: number;
  tags?: string[];
  notes?: string;
}) {
  const newLead = await createContact({
    full_name: data.full_name,
    company: data.company || null,
    email: data.email || null,
    phone: data.phone.startsWith("+") ? data.phone : `+91${data.phone.replace(/[^0-9]/g, "")}`,
    type: "lead",
    stage: data.stage || "new",
    source: data.source || "instagram",
    campaign: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    deal_value: data.deal_value || 0,
    tags: data.tags || [],
    notes: data.notes || null,
    last_contacted_at: null,
  });

  await logActivity(newLead.id, "created", `Lead created via AI Copilot (${newLead.source}).`);

  const settings = await getSettings();
  if (settings.notify_new_lead) {
    await sendWhatsAppNotification(
      `🎉 *New Lead Captured*\nName: ${newLead.full_name}\nPhone: ${newLead.phone}\nSource: ${newLead.source}\nValue: ₹${newLead.deal_value}`,
      `new_lead_${newLead.id}`
    );
  }

  const undoToken = await recordAgentAction("createLead", data, {
    type: "delete_contact",
    id: newLead.id,
  });
  return { ...newLead, undoToken };
}

export async function createTaskAction(data: {
  title: string;
  contact_id?: string;
  due_at?: string;
  priority?: TaskPriority;
  description?: string;
}) {
  const newTask = await createTask({
    contact_id: data.contact_id || null,
    title: data.title,
    description: data.description || null,
    due_at: data.due_at || null,
    remind_at: data.due_at || null,
    priority: data.priority || "medium",
    status: "open",
  });

  const undoToken = await recordAgentAction("createTask", data, {
    type: "delete_task",
    id: newTask.id,
  });
  return { ...newTask, undoToken };
}

export async function createMeetingAction(data: {
  contact_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  mode?: MeetingMode;
  location_or_link?: string;
  agenda?: string;
}) {
  const newMeeting = await createMeeting({
    contact_id: data.contact_id,
    title: data.title,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    mode: data.mode || "call",
    location_or_link: data.location_or_link || null,
    agenda: data.agenda || null,
    status: "scheduled",
    remind_minutes_before: 30,
  });

  const undoToken = await recordAgentAction("createMeeting", data, {
    type: "delete_meeting",
    id: newMeeting.id,
  });
  return { ...newMeeting, undoToken };
}

export async function addNoteAction(
  contact_id: string,
  body: string,
  type: "note" | "call" | "whatsapp" | "email" = "note"
) {
  const newActivity = await logActivity(contact_id, type, body);
  await updateContactFields(contact_id, { last_contacted_at: new Date().toISOString() });

  const undoToken = await recordAgentAction(
    "addNote",
    { contact_id, body, type },
    { type: "delete_activity", id: newActivity.id }
  );
  return { ...newActivity, undoToken };
}

export async function updateContactAction(id: string, updates: Partial<ContactItem>) {
  const previousState = await getContactById(id);
  if (!previousState) throw new Error("Contact not found");

  const updated = await updateContactFields(id, updates);
  if (!updated) throw new Error("Contact not found");

  const undoToken = await recordAgentAction(
    "updateContact",
    { id, updates },
    { type: "restore_contact", id, previousState }
  );
  return { ...updated, undoToken };
}

export async function moveStageAction(id: string, newStage: ContactStage) {
  const contact = await getContactById(id);
  if (!contact) throw new Error("Contact not found");

  const oldStage = contact.stage;
  const updated = await updateContactFields(id, { stage: newStage });
  if (!updated) throw new Error("Contact not found");

  await logActivity(
    id,
    "stage_change",
    `Moved stage from ${oldStage.toUpperCase()} to ${newStage.toUpperCase()} via AI Copilot.`,
    { old_stage: oldStage, new_stage: newStage }
  );

  const undoToken = await recordAgentAction(
    "moveStage",
    { id, newStage },
    { type: "restore_contact", id, previousState: { stage: oldStage } }
  );
  return { ...updated, undoToken };
}

export async function completeTaskAction(id: string) {
  const tasks = await getTasks();
  const task = tasks.find((t: TaskItem) => t.id === id);
  if (!task) throw new Error("Task not found");

  const oldStatus = task.status;
  const updated = await updateTaskFields(id, {
    status: "done",
    completed_at: new Date().toISOString(),
  });

  const undoToken = await recordAgentAction(
    "completeTask",
    { id },
    { type: "restore_task", id, previousState: { status: oldStatus, completed_at: null } }
  );
  return { ...(updated || task), undoToken };
}

// Confirmation Execution Handlers (only for deletes or bulk changes over 5)

export async function executeConfirmationProposalAction(proposalType: string, params: any) {
  switch (proposalType) {
    case "bulkUpdate": {
      const { filterStage, newStage } = params;
      const count = await bulkUpdateStage(filterStage, newStage);
      return { success: true, message: `Updated ${count} leads from ${filterStage} to ${newStage}` };
    }

    case "deleteContact": {
      const contact = await getContactById(params.contact_id);
      if (!contact) return { success: false, message: "Contact not found" };
      await deleteContact(params.contact_id);
      return { success: true, message: `Deleted contact ${contact.full_name}` };
    }

    case "deleteTask": {
      const tasks = await getTasks();
      const task = tasks.find((t: TaskItem) => t.id === params.task_id);
      if (!task) return { success: false, message: "Task not found" };
      await deleteTask(params.task_id);
      return { success: true, message: `Deleted task "${task.title}"` };
    }

    default:
      throw new Error(`Unknown proposal type: ${proposalType}`);
  }
}

export async function generateImageAction(data: {
  prompt: string;
  aspect_ratio?: "square" | "landscape" | "portrait";
  style?: "photorealistic" | "digital_art" | "minimalist" | "logo" | "3d_render";
}) {
  const width = data.aspect_ratio === "landscape" ? 1280 : data.aspect_ratio === "portrait" ? 720 : 1024;
  const height = data.aspect_ratio === "landscape" ? 720 : data.aspect_ratio === "portrait" ? 1280 : 1024;

  const styleTag = data.style || "photorealistic";
  const promptText = data.prompt.trim();

  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;

  return {
    success: true,
    imageUrl,
    prompt: promptText,
    aspect_ratio: data.aspect_ratio || "square",
    style: styleTag,
    width,
    height,
  };
}
