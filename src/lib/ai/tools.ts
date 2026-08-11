import { tool } from "ai";
import { z } from "zod";
import {
  searchContactsAction,
  getContactAction,
  getTodayAgendaAction,
  getPipelineSummaryAction,
  getLeadsByFilterAction,
  createLeadAction,
  createTaskAction,
  createMeetingAction,
  addNoteAction,
  updateContactAction,
  moveStageAction,
  completeTaskAction,
  generateImageAction,
} from "./actions";

export const aiTools: Record<string, any> = {
  // --- READ TOOLS (Immediate execution) ---

  searchContacts: tool({
    description: "Search CRM contacts by name, company, phone, tag, or email.",
    parameters: z.object({
      query: z.string().describe("Search term (e.g., 'Rahul', 'Verma Tech', 'Shopify')"),
    }),
    execute: async ({ query }: any) => {
      const results = await searchContactsAction(query);
      return { query, count: results.length, results };
    },
  } as any),

  getContact: tool({
    description: "Get full contact profile with last 5 activities and open tasks.",
    parameters: z.object({
      idOrName: z.string().describe("Contact ID or contact full name"),
    }),
    execute: async ({ idOrName }: any) => {
      const data = await getContactAction(idOrName);
      if (!data) return { found: false, message: `No contact matching "${idOrName}"` };
      return { found: true, ...data };
    },
  } as any),

  getTodayAgenda: tool({
    description: "Get today's tasks, meetings, and overdue items.",
    parameters: z.object({}),
    execute: async () => {
      const agenda = await getTodayAgendaAction();
      return { success: true, ...agenda };
    },
  } as any),

  getPipelineSummary: tool({
    description: "Get current pipeline breakdown: total value, stage counts, and values.",
    parameters: z.object({
      source: z.string().optional().describe("Filter by traffic source e.g. 'instagram', 'whatsapp', 'website'"),
    }),
    execute: async ({ source }: any) => {
      const summary = await getPipelineSummaryAction(source);
      return { success: true, ...summary };
    },
  } as any),

  getLeadsByFilter: tool({
    description: "Filter leads by source, stage, tag, or staleness.",
    parameters: z.object({
      source: z.string().optional(),
      stage: z.string().optional(),
      tag: z.string().optional(),
      staleOnly: z.boolean().optional().describe("Set true to get leads not contacted in >7 days"),
    }),
    execute: async (filters: any) => {
      const leads = await getLeadsByFilterAction(filters);
      return { count: leads.length, leads };
    },
  } as any),

  // --- WRITE TOOLS (Direct execution, returns undoToken) ---

  createLead: tool({
    description: "Create a new lead in the CRM.",
    parameters: z.object({
      full_name: z.string().describe("Full name of prospect"),
      phone: z.string().describe("Phone number (e.g. +91 98765 43210 or 9876543210)"),
      company: z.string().optional(),
      email: z.string().optional(),
      source: z.enum(["instagram", "facebook", "whatsapp", "linkedin", "website", "referral", "manual", "other"]).optional(),
      stage: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
      deal_value: z.number().optional().describe("Estimated deal value in INR"),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }),
    execute: async (params: any) => {
      const result = await createLeadAction(params);
      return { success: true, lead_id: result.id, name: result.full_name, stage: result.stage, undoToken: result.undoToken };
    },
  } as any),

  createTask: tool({
    description: "Create a new task.",
    parameters: z.object({
      title: z.string().describe("Task description/title"),
      contact_id: z.string().optional().describe("Associated contact ID"),
      due_at: z.string().optional().describe("ISO datetime string for due date/time"),
      priority: z.enum(["low", "medium", "high"]).optional(),
      description: z.string().optional(),
    }),
    execute: async (params: any) => {
      const result = await createTaskAction(params);
      return { success: true, task_id: result.id, title: result.title, due_at: result.due_at, undoToken: result.undoToken };
    },
  } as any),

  createMeeting: tool({
    description: "Schedule a meeting or discovery call.",
    parameters: z.object({
      contact_id: z.string().describe("Contact ID"),
      title: z.string().describe("Meeting title"),
      starts_at: z.string().describe("ISO start datetime"),
      ends_at: z.string().describe("ISO end datetime"),
      mode: z.enum(["video", "call", "in_person"]).optional(),
      location_or_link: z.string().optional(),
      agenda: z.string().optional(),
    }),
    execute: async (params: any) => {
      const result = await createMeetingAction(params);
      return { success: true, meeting_id: result.id, title: result.title, starts_at: result.starts_at, undoToken: result.undoToken };
    },
  } as any),

  addNote: tool({
    description: "Add an activity log entry or note to a contact.",
    parameters: z.object({
      contact_id: z.string().describe("Target contact ID"),
      body: z.string().describe("Note/activity body text"),
      type: z.enum(["note", "call", "whatsapp", "email"]).optional(),
    }),
    execute: async ({ contact_id, body, type }: any) => {
      const result = await addNoteAction(contact_id, body, type || "note");
      return { success: true, note_id: result.id, body: result.body, undoToken: result.undoToken };
    },
  } as any),

  updateContact: tool({
    description: "Update contact details (phone, email, company, deal value, tags).",
    parameters: z.object({
      id: z.string().describe("Contact ID"),
      company: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      deal_value: z.number().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }),
    execute: async ({ id, ...updates }: any) => {
      const result = await updateContactAction(id, updates);
      return { success: true, id: result.id, name: result.full_name, undoToken: result.undoToken };
    },
  } as any),

  moveStage: tool({
    description: "Move a lead to a different pipeline stage (new, contacted, qualified, proposal, won, lost).",
    parameters: z.object({
      id: z.string().describe("Contact ID"),
      stage: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
    }),
    execute: async ({ id, stage }: any) => {
      const result = await moveStageAction(id, stage);
      return { success: true, id: result.id, name: result.full_name, new_stage: result.stage, undoToken: result.undoToken };
    },
  } as any),

  completeTask: tool({
    description: "Mark a task as done.",
    parameters: z.object({
      id: z.string().describe("Task ID"),
    }),
    execute: async ({ id }: any) => {
      const result = await completeTaskAction(id);
      return { success: true, id: result.id, title: result.title, status: result.status, undoToken: result.undoToken };
    },
  } as any),

  generateImage: tool({
    description: "Generate high resolution AI marketing images, posters, logos, banners, or proposal visual assets.",
    parameters: z.object({
      prompt: z.string().describe("Detailed description of image to generate"),
      aspect_ratio: z.enum(["square", "landscape", "portrait"]).optional().describe("Image aspect ratio (square: 1024x1024, landscape: 1280x720, portrait: 720x1280)"),
      style: z.enum(["photorealistic", "digital_art", "minimalist", "logo", "3d_render"]).optional().describe("Visual style preset"),
    }),
    execute: async (params: any) => {
      return generateImageAction(params);
    },
  } as any),

  // --- CONFIRMATION-REQUIRED TOOLS (Delete & Bulk >5 ONLY) ---

  bulkUpdate: tool({
    description: "Propose moving multiple contacts from one stage to another. Returns a PROPOSAL object for user confirmation.",
    parameters: z.object({
      filterStage: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
      newStage: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
    }),
    execute: async ({ filterStage, newStage }: any) => {
      return {
        isProposal: true,
        proposalType: "bulkUpdate",
        summary: `Bulk move all contacts in "${String(filterStage).toUpperCase()}" stage to "${String(newStage).toUpperCase()}"`,
        params: { filterStage, newStage },
      };
    },
  } as any),

  deleteContact: tool({
    description: "Propose deleting a contact. Returns a PROPOSAL object for user confirmation.",
    parameters: z.object({
      contact_id: z.string().describe("Contact ID to delete"),
    }),
    execute: async ({ contact_id }: any) => {
      const contact = await getContactAction(contact_id);
      return {
        isProposal: true,
        proposalType: "deleteContact",
        summary: `Permanently delete contact: ${contact?.contact?.full_name || contact_id}`,
        params: { contact_id },
      };
    },
  } as any),

  deleteTask: tool({
    description: "Propose deleting a task. Returns a PROPOSAL object for user confirmation.",
    parameters: z.object({
      task_id: z.string().describe("Task ID to delete"),
    }),
    execute: async ({ task_id }: any) => {
      return {
        isProposal: true,
        proposalType: "deleteTask",
        summary: `Permanently delete task: ${task_id}`,
        params: { task_id },
      };
    },
  } as any),
};
