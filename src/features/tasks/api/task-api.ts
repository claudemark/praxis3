import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { TaskItem, TaskStatus, TaskPriority } from "../store/task-store";

type TaskDbRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  assignee_id?: string | null;
  created_at: string;
  checklist?: any;
  comments?: any;
  recurrence?: any;
  tags?: string[] | null;
};

const TASK_ENDPOINT = "/tasks";

const toAppModel = (record: TaskDbRecord): TaskItem => ({
  id: record.id,
  title: record.title,
  description: record.description,
  status: record.status as TaskStatus,
  priority: record.priority as TaskPriority,
  dueDate: record.due_date,
  assigneeId: record.assignee_id || undefined,
  createdAt: record.created_at,
  checklist: record.checklist || [],
  comments: record.comments || [],
  recurrence: record.recurrence || undefined,
  tags: record.tags || undefined,
});

const toDbRecord = (task: Partial<TaskItem>): Partial<TaskDbRecord> => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  due_date: task.dueDate,
  assignee_id: task.assigneeId || null,
  created_at: task.createdAt,
  checklist: task.checklist || null,
  comments: task.comments || null,
  recurrence: task.recurrence || null,
  tags: task.tags || null,
});

export async function fetchTasksFromSupabase(): Promise<TaskItem[]> {
  console.log("[Task API] Fetching tasks, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<TaskDbRecord[]>(`${TASK_ENDPOINT}?select=*&order=due_date.asc`);
  console.log("[Task API] Fetched", records.length, "tasks from Supabase");
  return records.map(toAppModel);
}

export async function createTaskInSupabase(task: TaskItem): Promise<TaskItem> {
  console.log("[Task API] Creating task:", task.title);
  if (!isSupabaseConfigured) {
    return task;
  }
  try {
    const [record] = await supabaseRequest<TaskDbRecord[]>(TASK_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toDbRecord(task)),
    });
    console.log("[Task API] Task created successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[Task API] Error creating task:", error);
    throw error;
  }
}

export async function updateTaskInSupabase(id: string, changes: Partial<TaskItem>): Promise<TaskItem | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const payload = toDbRecord({ ...changes, id });
  delete payload.id;
  if (Object.keys(payload).length === 0) {
    return null;
  }
  const [record] = await supabaseRequest<TaskDbRecord[]>(`${TASK_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return record ? toAppModel(record) : null;
}

export async function deleteTaskInSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabaseRequest(`${TASK_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    skipJsonParse: true,
  });
}

// ============= GENERAL EMPLOYEE TASKS =============

import type { GeneralEmployeeTask } from "@/data/tasks";

const GENERAL_TASKS_ENDPOINT = "/general_tasks";

type GeneralTaskDbRecord = {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  cadence: string;
  active: boolean;
  created_at: string;
  updated_at: string | null;
};

const toGeneralTaskAppModel = (db: GeneralTaskDbRecord): GeneralEmployeeTask => ({
  id: db.id,
  employeeId: db.employee_id,
  title: db.title,
  description: db.description || undefined,
  cadence: db.cadence as "daily" | "weekly" | "monthly" | "once",
  active: db.active,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

const toGeneralTaskDbRecord = (task: Partial<GeneralEmployeeTask>): Partial<GeneralTaskDbRecord> => ({
  id: task.id,
  employee_id: task.employeeId,
  title: task.title,
  description: task.description || null,
  cadence: task.cadence,
  active: task.active,
  created_at: task.createdAt,
  updated_at: task.updatedAt || null,
});

export async function fetchGeneralTasksFromSupabase(): Promise<GeneralEmployeeTask[]> {
  console.log("[Task API] Fetching general tasks...");
  if (!isSupabaseConfigured) {
    console.log("[Task API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<GeneralTaskDbRecord[]>(
      `${GENERAL_TASKS_ENDPOINT}?select=*&order=created_at.desc`
    );
    console.log("[Task API] Fetched general tasks:", records.length);
    return records.map(toGeneralTaskAppModel);
  } catch (error) {
    console.error("[Task API] Error fetching general tasks:", error);
    throw error;
  }
}

export async function createGeneralTaskInSupabase(task: GeneralEmployeeTask): Promise<GeneralEmployeeTask> {
  console.log("[Task API] Creating general task:", task);
  if (!isSupabaseConfigured) {
    return task;
  }
  
  try {
    const payload = toGeneralTaskDbRecord(task);
    const [created] = await supabaseRequest<GeneralTaskDbRecord[]>(GENERAL_TASKS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Task API] General task created:", created.id);
    return toGeneralTaskAppModel(created);
  } catch (error) {
    console.error("[Task API] Error creating general task:", error);
    throw error;
  }
}

export async function updateGeneralTaskInSupabase(id: string, task: Partial<GeneralEmployeeTask>): Promise<void> {
  console.log("[Task API] Updating general task:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toGeneralTaskDbRecord(task);
    await supabaseRequest(`${GENERAL_TASKS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Task API] General task updated successfully");
  } catch (error) {
    console.error("[Task API] Error updating general task:", error);
    throw error;
  }
}

export async function deleteGeneralTaskFromSupabase(id: string): Promise<void> {
  console.log("[Task API] Deleting general task:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${GENERAL_TASKS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Task API] General task deleted successfully");
  } catch (error) {
    console.error("[Task API] Error deleting general task:", error);
    throw error;
  }
}

// ============= SOP CHECKLISTS =============

import type { SopChecklist } from "@/data/tasks";

const SOP_CHECKLISTS_ENDPOINT = "/sop_checklists";

type SopChecklistDbRecord = {
  id: string;
  name: string;
  steps: string[];
  owner_id: string;
  last_audit: string;
  compliance: number;
  category: string | null;
  description: string | null;
  updated_at: string | null;
};

const toSopChecklistAppModel = (db: SopChecklistDbRecord): SopChecklist => ({
  id: db.id,
  name: db.name,
  steps: db.steps || [],
  ownerId: db.owner_id,
  lastAudit: db.last_audit,
  compliance: db.compliance,
  category: db.category || undefined,
  description: db.description || undefined,
  updatedAt: db.updated_at || undefined,
});

const toSopChecklistDbRecord = (checklist: Partial<SopChecklist>): Partial<SopChecklistDbRecord> => ({
  id: checklist.id,
  name: checklist.name,
  steps: checklist.steps,
  owner_id: checklist.ownerId,
  last_audit: checklist.lastAudit,
  compliance: checklist.compliance,
  category: checklist.category || null,
  description: checklist.description || null,
  updated_at: checklist.updatedAt || null,
});

export async function fetchSopChecklistsFromSupabase(): Promise<SopChecklist[]> {
  console.log("[Task API] Fetching SOP checklists...");
  if (!isSupabaseConfigured) {
    console.log("[Task API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<SopChecklistDbRecord[]>(
      `${SOP_CHECKLISTS_ENDPOINT}?select=*&order=name.asc`
    );
    console.log("[Task API] Fetched SOP checklists:", records.length);
    return records.map(toSopChecklistAppModel);
  } catch (error) {
    console.error("[Task API] Error fetching SOP checklists:", error);
    throw error;
  }
}

export async function createSopChecklistInSupabase(checklist: SopChecklist): Promise<SopChecklist> {
  console.log("[Task API] Creating SOP checklist:", checklist);
  if (!isSupabaseConfigured) {
    return checklist;
  }
  
  try {
    const payload = toSopChecklistDbRecord(checklist);
    const [created] = await supabaseRequest<SopChecklistDbRecord[]>(SOP_CHECKLISTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Task API] SOP checklist created:", created.id);
    return toSopChecklistAppModel(created);
  } catch (error) {
    console.error("[Task API] Error creating SOP checklist:", error);
    throw error;
  }
}

export async function updateSopChecklistInSupabase(id: string, checklist: Partial<SopChecklist>): Promise<void> {
  console.log("[Task API] Updating SOP checklist:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toSopChecklistDbRecord(checklist);
    await supabaseRequest(`${SOP_CHECKLISTS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Task API] SOP checklist updated successfully");
  } catch (error) {
    console.error("[Task API] Error updating SOP checklist:", error);
    throw error;
  }
}

export async function deleteSopChecklistFromSupabase(id: string): Promise<void> {
  console.log("[Task API] Deleting SOP checklist:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${SOP_CHECKLISTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Task API] SOP checklist deleted successfully");
  } catch (error) {
    console.error("[Task API] Error deleting SOP checklist:", error);
    throw error;
  }
}
