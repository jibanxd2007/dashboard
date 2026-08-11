import { mockDb, ContactItem, TaskItem, MeetingItem, ActivityItem, AgentActionItem } from "@/lib/mockStore";
import { ContactStage, ContactSource, ContactType, TaskPriority, MeetingMode } from "@/lib/database.types";
import { sendWhatsAppNotification } from "@/lib/notify/whatsapp";

// --- AGENT ACTION UNDO ENGINE ---

export async function recordAgentAction(toolName: string, payload: any, inverse: any) {
  const action: AgentActionItem = {
    id: `act_${Math.random().toString(36).substring(2, 10)}`,
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
      case "delete_contact": {
        const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === inverse.id);
        if (index !== -1) mockDb.contacts.splice(index, 1);
        break;
      }
      case "delete_task": {
        const index = mockDb.tasks.findIndex((t: TaskItem) => t.id === inverse.id);
        if (index !== -1) mockDb.tasks.splice(index, 1);
        break;
      }
      case "delete_meeting": {
        const index = mockDb.meetings.findIndex((m: MeetingItem) => m.id === inverse.id);
        if (index !== -1) mockDb.meetings.splice(index, 1);
        break;
      }
      case "restore_contact": {
        const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === inverse.id);
        if (index !== -1) {
          mockDb.contacts[index] = { ...mockDb.contacts[index], ...inverse.previousState };
        }
        break;
      }
      case "restore_task": {
        const index = mockDb.tasks.findIndex((t: TaskItem) => t.id === inverse.id);
        if (index !== -1) {
          mockDb.tasks[index] = { ...mockDb.tasks[index], ...inverse.previousState };
        }
        break;
      }
      case "delete_activity": {
        const index = mockDb.activities.findIndex((a: ActivityItem) => a.id === inverse.id);
        if (index !== -1) mockDb.activities.splice(index, 1);
        break;
      }
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
  const contacts = mockDb.contacts.filter((c: ContactItem) =>
    c.full_name.toLowerCase().includes(q) ||
    (c.company && c.company.toLowerCase().includes(q)) ||
    c.phone.includes(q) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    c.tags.some((t: string) => t.toLowerCase().includes(q))
  );
  return contacts.slice(0, 10);
}

export async function getContactAction(idOrName: string) {
  let contact = mockDb.contacts.find((c: ContactItem) => c.id === idOrName);
  if (!contact) {
    const matches = await searchContactsAction(idOrName);
    contact = matches[0];
  }
  if (!contact) return null;

  const activities = mockDb.activities
    .filter((a: ActivityItem) => a.contact_id === contact!.id)
    .slice(0, 5);

  const openTasks = mockDb.tasks.filter(
    (t: TaskItem) => t.contact_id === contact!.id && t.status === "open"
  );

  return { contact, activities, openTasks };
}

export async function getTodayAgendaAction() {
  const now = new Date();
  const todayTasks = mockDb.tasks.filter((t: TaskItem) => {
    if (t.status !== "open" || !t.due_at) return false;
    const d = new Date(t.due_at);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const overdueTasks = mockDb.tasks.filter(
    (t: TaskItem) => t.status === "open" && t.due_at && new Date(t.due_at) < now
  );

  const todayMeetings = mockDb.meetings.filter((m: MeetingItem) => {
    const d = new Date(m.starts_at);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear() &&
      m.status !== "cancelled"
    );
  });

  return { todayTasks, overdueTasks, todayMeetings };
}

export async function getPipelineSummaryAction(sourceFilter?: string) {
  let contacts = mockDb.contacts;
  if (sourceFilter && sourceFilter !== "all") {
    contacts = contacts.filter((c: ContactItem) => c.source === sourceFilter);
  }

  const stages: Record<string, { count: number; value: number }> = {};
  for (const c of contacts) {
    if (!stages[c.stage]) stages[c.stage] = { count: 0, value: 0 };
    stages[c.stage].count += 1;
    stages[c.stage].value += c.deal_value || 0;
  }

  const totalValue = contacts
    .filter((c: ContactItem) => !["lost", "churned"].includes(c.stage))
    .reduce((sum: number, c: ContactItem) => sum + (c.deal_value || 0), 0);

  return { totalValue, totalContacts: contacts.length, stages };
}

export async function getLeadsByFilterAction(filters: {
  source?: string;
  stage?: string;
  tag?: string;
  staleOnly?: boolean;
}) {
  const now = new Date();
  const staleThresholdMs = (mockDb.settings.stale_lead_days || 7) * 86400 * 1000;

  return mockDb.contacts.filter((c: ContactItem) => {
    if (filters.source && filters.source !== "all" && c.source !== filters.source) return false;
    if (filters.stage && filters.stage !== "all" && c.stage !== filters.stage) return false;
    if (filters.tag && !c.tags.includes(filters.tag)) return false;
    if (filters.staleOnly) {
      if (["won", "lost"].includes(c.stage)) return false;
      const lastContact = c.last_contacted_at || c.created_at;
      if (now.getTime() - new Date(lastContact).getTime() <= staleThresholdMs) return false;
    }
    return true;
  });
}

// --- WRITE ACTIONS (Execute immediately & store inverse for Undo) ---

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
  const newLead: ContactItem = {
    id: `c_${Math.random().toString(36).substring(2, 10)}`,
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockDb.contacts.unshift(newLead);

  mockDb.activities.unshift({
    id: `a_${Math.random().toString(36).substring(2, 10)}`,
    contact_id: newLead.id,
    type: "created",
    body: `Lead created via AI Copilot (${newLead.source}).`,
    meta: {},
    created_at: new Date().toISOString(),
  });

  // Owner WhatsApp alert
  if (mockDb.settings.notify_new_lead) {
    await sendWhatsAppNotification(
      `🎉 *New Lead Captured*\nName: ${newLead.full_name}\nPhone: ${newLead.phone}\nSource: ${newLead.source}\nValue: ₹${newLead.deal_value}`,
      `new_lead_${newLead.id}`
    );
  }

  const undoToken = await recordAgentAction("createLead", data, { type: "delete_contact", id: newLead.id });
  return { ...newLead, undoToken };
}

export async function createTaskAction(data: {
  title: string;
  contact_id?: string;
  due_at?: string;
  priority?: TaskPriority;
  description?: string;
}) {
  const newTask: TaskItem = {
    id: `t_${Math.random().toString(36).substring(2, 10)}`,
    contact_id: data.contact_id || null,
    title: data.title,
    description: data.description || null,
    due_at: data.due_at || null,
    remind_at: data.due_at || null,
    priority: data.priority || "medium",
    status: "open",
    completed_at: null,
    reminded_at: null,
    created_at: new Date().toISOString(),
  };

  mockDb.tasks.unshift(newTask);
  const undoToken = await recordAgentAction("createTask", data, { type: "delete_task", id: newTask.id });
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
  const newMeeting: MeetingItem = {
    id: `m_${Math.random().toString(36).substring(2, 10)}`,
    contact_id: data.contact_id,
    title: data.title,
    starts_at: data.starts_at,
    ends_at: data.ends_at,
    mode: data.mode || "call",
    location_or_link: data.location_or_link || null,
    agenda: data.agenda || null,
    status: "scheduled",
    remind_minutes_before: 30,
    reminded_at: null,
    created_at: new Date().toISOString(),
  };

  mockDb.meetings.unshift(newMeeting);
  const undoToken = await recordAgentAction("createMeeting", data, { type: "delete_meeting", id: newMeeting.id });
  return { ...newMeeting, undoToken };
}

export async function addNoteAction(contact_id: string, body: string, type: "note" | "call" | "whatsapp" | "email" = "note") {
  const newActivity: ActivityItem = {
    id: `a_${Math.random().toString(36).substring(2, 10)}`,
    contact_id,
    type,
    body,
    meta: {},
    created_at: new Date().toISOString(),
  };

  mockDb.activities.unshift(newActivity);
  const contact = mockDb.contacts.find((c: ContactItem) => c.id === contact_id);
  if (contact) contact.last_contacted_at = new Date().toISOString();

  const undoToken = await recordAgentAction("addNote", { contact_id, body, type }, { type: "delete_activity", id: newActivity.id });
  return { ...newActivity, undoToken };
}

export async function updateContactAction(id: string, updates: Partial<ContactItem>) {
  const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === id);
  if (index === -1) throw new Error("Contact not found");

  const previousState = { ...mockDb.contacts[index] };
  mockDb.contacts[index] = {
    ...mockDb.contacts[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const undoToken = await recordAgentAction("updateContact", { id, updates }, { type: "restore_contact", id, previousState });
  return { ...mockDb.contacts[index], undoToken };
}

export async function moveStageAction(id: string, newStage: ContactStage) {
  const contact = mockDb.contacts.find((c: ContactItem) => c.id === id);
  if (!contact) throw new Error("Contact not found");

  const oldStage = contact.stage;
  contact.stage = newStage;
  contact.updated_at = new Date().toISOString();

  mockDb.activities.unshift({
    id: `a_${Math.random().toString(36).substring(2, 10)}`,
    contact_id: id,
    type: "stage_change",
    body: `Moved stage from ${oldStage.toUpperCase()} to ${newStage.toUpperCase()} via AI Copilot.`,
    meta: { old_stage: oldStage, new_stage: newStage },
    created_at: new Date().toISOString(),
  });

  const undoToken = await recordAgentAction("moveStage", { id, newStage }, { type: "restore_contact", id, previousState: { stage: oldStage } });
  return { ...contact, undoToken };
}

export async function completeTaskAction(id: string) {
  const task = mockDb.tasks.find((t: TaskItem) => t.id === id);
  if (!task) throw new Error("Task not found");

  const oldStatus = task.status;
  task.status = "done";
  task.completed_at = new Date().toISOString();

  const undoToken = await recordAgentAction("completeTask", { id }, { type: "restore_task", id, previousState: { status: oldStatus, completed_at: null } });
  return { ...task, undoToken };
}

// Confirmation Execution Handlers (Only for Delete or Bulk > 5)

export async function executeConfirmationProposalAction(proposalType: string, params: any) {
  switch (proposalType) {
    case "bulkUpdate": {
      const { filterStage, newStage } = params;
      let count = 0;
      for (const c of mockDb.contacts) {
        if (c.stage === filterStage) {
          c.stage = newStage;
          c.updated_at = new Date().toISOString();
          count++;
        }
      }
      return { success: true, message: `Updated ${count} leads from ${filterStage} to ${newStage}` };
    }

    case "deleteContact": {
      const { contact_id } = params;
      const index = mockDb.contacts.findIndex((c: ContactItem) => c.id === contact_id);
      if (index !== -1) {
        const removed = mockDb.contacts.splice(index, 1)[0];
        return { success: true, message: `Deleted contact ${removed.full_name}` };
      }
      return { success: false, message: "Contact not found" };
    }

    case "deleteTask": {
      const { task_id } = params;
      const index = mockDb.tasks.findIndex((t: TaskItem) => t.id === task_id);
      if (index !== -1) {
        const removed = mockDb.tasks.splice(index, 1)[0];
        return { success: true, message: `Deleted task "${removed.title}"` };
      }
      return { success: false, message: "Task not found" };
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
