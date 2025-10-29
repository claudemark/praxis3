import { create } from "zustand";
import { nanoid } from "nanoid";

import { employees } from "@/data/employees";
import {
  generalEmployeeTasks as initialGeneralTasks,
  sopChecklists as initialSopChecklists,
  type GeneralEmployeeTask,
  type GeneralTaskCadence,
  type SopChecklist,
} from "@/data/tasks";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskComment {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
}

export interface RecurrenceRule {
  pattern: "daily" | "weekly" | "monthly";
  nextOccurrence: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId?: string;
  createdAt: string;
  checklist?: { id: string; label: string; completed: boolean }[];
  comments: TaskComment[];
  recurrence?: RecurrenceRule;
  tags?: string[];
}

export type GeneralTaskInput = Omit<
  GeneralEmployeeTask,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SopChecklistInput = Omit<SopChecklist, "id" | "updatedAt"> & {
  id?: string;
  updatedAt?: string;
};

interface TaskStoreState {
  tasks: TaskItem[];
  generalTasks: GeneralEmployeeTask[];
  sopChecklists: SopChecklist[];
  createTask: (payload: {
    title: string;
    description: string;
    status?: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    assigneeId?: string;
    tags?: string[];
    recurrence?: RecurrenceRule;
  }) => TaskItem;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addComment: (taskId: string, authorId: string, message: string) => void;
  toggleChecklistItem: (taskId: string, checklistId: string) => void;
  assignTask: (taskId: string, employeeId: string) => void;
  updateTask: (taskId: string, changes: Partial<Omit<TaskItem, "id" | "createdAt">>) => void;
  deleteTask: (taskId: string) => void;
  addGeneralTask: (payload: GeneralTaskInput) => GeneralEmployeeTask;
  updateGeneralTask: (taskId: string, changes: Partial<Omit<GeneralEmployeeTask, "id" | "createdAt">>) => void;
  deleteGeneralTask: (taskId: string) => void;
  addSopChecklist: (payload: SopChecklistInput) => SopChecklist;
  updateSopChecklist: (id: string, changes: Partial<Omit<SopChecklist, "id">>) => void;
  deleteSopChecklist: (id: string) => void;
}

const initialTasks: TaskItem[] = [
  {
    id: "TASK-481",
    title: "Prä-OP Check Orthesenkoffer",
    description: "Material- und Instrumentenliste für morgige Knie-OP validieren.",
    status: "todo",
    priority: "high",
    dueDate: "2025-09-24T09:00:00",
    assigneeId: "emp-feld",
    createdAt: "2025-09-24T07:40:00",
    checklist: [
      { id: "chk-1", label: "Implantatgröße bestätigt", completed: true },
      { id: "chk-2", label: "Röntgenbilder im PACS", completed: false },
      { id: "chk-3", label: "Anästhesie aufgeklärt", completed: false },
    ],
    comments: [
      {
        id: nanoid(),
        authorId: "emp-feld",
        message: "Implantatgröße 4M bestätigt, warte auf Radiologie-Upload.",
        createdAt: "2025-09-24T08:10:00",
      },
    ],
    tags: ["Prä-OP", "Material"],
    recurrence: { pattern: "weekly", nextOccurrence: "2025-10-01T08:00:00" },
  },
  {
    id: "TASK-472",
    title: "Post-OP Mobilisation Stufe 1",
    description: "Physiotherapie-Plan und Hilfsmittel prüfen.",
    status: "in-progress",
    priority: "medium",
    dueDate: "2025-09-24T12:00:00",
    assigneeId: "emp-boettcher",
    createdAt: "2025-09-24T06:45:00",
    checklist: [
      { id: "chk-4", label: "Belastung abgestimmt", completed: true },
      { id: "chk-5", label: "Hilfsmittel organisiert", completed: true },
      { id: "chk-6", label: "Übungsplan verordnet", completed: false },
    ],
    comments: [
      {
        id: nanoid(),
        authorId: "emp-boettcher",
        message: "Hilfsmittel-Set ist vorbereitet.",
        createdAt: "2025-09-24T08:14:00",
      },
    ],
    tags: ["Post-OP", "Physio"],
  },
  {
    id: "TASK-462",
    title: "QS Audit Trauma SOP",
    description: "Audit-Trail exportieren und Unterschrift Praxisleitung einholen.",
    status: "review",
    priority: "urgent",
    dueDate: "2025-09-24T10:30:00",
    assigneeId: "emp-nguyen",
    createdAt: "2025-09-23T16:30:00",
    comments: [
      {
        id: nanoid(),
        authorId: "emp-nguyen",
        message: "Audit-Trail exportiert, bitte Unterschrift vorbereiten.",
        createdAt: "2025-09-24T07:55:00",
      },
      {
        id: nanoid(),
        authorId: "emp-krause",
        message: "Signatur erfolgt um 09:30 Uhr.",
        createdAt: "2025-09-24T09:05:00",
      },
    ],
    tags: ["QS", "Audit"],
  },
  {
    id: "TASK-447",
    title: "Lagerprüfung Implantatserie 21B",
    description: "Bestandsabgleich und automatische Nachbestellung auslösen.",
    status: "done",
    priority: "medium",
    dueDate: "2025-09-23T16:00:00",
    assigneeId: "emp-rehm",
    createdAt: "2025-09-22T13:00:00",
    comments: [
      {
        id: nanoid(),
        authorId: "emp-rehm",
        message: "SAP-Bestellung OR-5521 angestoßen.",
        createdAt: "2025-09-23T15:30:00",
      },
    ],
    tags: ["Lager", "Implantate"],
    recurrence: { pattern: "monthly", nextOccurrence: "2025-10-23T10:00:00" },
  },
];

export const useTaskStore = create<TaskStoreState>((set) => ({
  tasks: initialTasks,
  generalTasks: initialGeneralTasks,
  sopChecklists: initialSopChecklists,
  createTask: ({ title, description, status = "todo", priority, dueDate, assigneeId, recurrence, tags }) => {
    const newTask: TaskItem = {
      id: `TASK-${nanoid(4).toUpperCase()}`,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      assigneeId,
      recurrence,
      tags,
      createdAt: new Date().toISOString(),
      comments: [],
      checklist: [],
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    return newTask;
  },
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    })),
  addComment: (taskId, authorId, message) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [
                ...task.comments,
                {
                  id: nanoid(),
                  authorId,
                  message,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : task,
      ),
    })),
  toggleChecklistItem: (taskId, checklistId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              checklist: task.checklist?.map((item) =>
                item.id === checklistId ? { ...item, completed: !item.completed } : item,
              ),
            }
          : task,
      ),
    })),
  assignTask: (taskId, employeeId) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, assigneeId: employeeId } : task)),
    })),
  updateTask: (taskId, changes) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...changes,
              title: changes.title?.trim() ?? task.title,
              description: changes.description?.trim() ?? task.description,
            }
          : task,
      ),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  addGeneralTask: ({ id, employeeId, title, description, cadence, active = true, createdAt, updatedAt }) => {
    const task: GeneralEmployeeTask = {
      id: id?.trim() || `gentask-${nanoid(6)}`,
      employeeId,
      title: title.trim(),
      description: description?.trim() || undefined,
      cadence,
      active,
      createdAt: createdAt ?? new Date().toISOString(),
      updatedAt,
    };
    set((state) => ({ generalTasks: [task, ...state.generalTasks] }));
    return task;
  },
  updateGeneralTask: (taskId, changes) =>
    set((state) => ({
      generalTasks: state.generalTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...changes,
              title: changes.title?.trim() ?? task.title,
              description: changes.description?.trim() ?? task.description,
              updatedAt: changes.updatedAt ?? new Date().toISOString(),
            }
          : task,
      ),
    })),
  deleteGeneralTask: (taskId) =>
    set((state) => ({
      generalTasks: state.generalTasks.filter((task) => task.id !== taskId),
    })),
  addSopChecklist: ({ id, name, steps, ownerId, lastAudit, compliance, category, description, updatedAt }) => {
    const checklist: SopChecklist = {
      id: id?.trim() || `sop-${nanoid(6)}`,
      name: name.trim(),
      steps: steps.map((step) => step.trim()).filter(Boolean),
      ownerId: ownerId.trim(),
      lastAudit,
      compliance,
      category: category?.trim() || undefined,
      description: description?.trim() || undefined,
      updatedAt: updatedAt ?? new Date().toISOString(),
    };
    set((state) => ({ sopChecklists: [checklist, ...state.sopChecklists] }));
    return checklist;
  },
  updateSopChecklist: (id, changes) =>
    set((state) => ({
      sopChecklists: state.sopChecklists.map((checklist) =>
        checklist.id === id
          ? {
              ...checklist,
              ...changes,
              name: changes.name?.trim() ?? checklist.name,
              ownerId: changes.ownerId?.trim() ?? checklist.ownerId,
              category: changes.category?.trim() || checklist.category,
              description: changes.description?.trim() || checklist.description,
              steps: changes.steps
                ? changes.steps.map((step) => step.trim()).filter(Boolean)
                : checklist.steps,
              updatedAt: changes.updatedAt ?? new Date().toISOString(),
            }
          : checklist,
      ),
    })),
  deleteSopChecklist: (id) =>
    set((state) => ({
      sopChecklists: state.sopChecklists.filter((entry) => entry.id !== id),
    })),
}));

export function getPriorityLabel(priority: TaskPriority) {
  switch (priority) {
    case "low":
      return "Niedrig";
    case "medium":
      return "Mittel";
    case "high":
      return "Hoch";
    case "urgent":
      return "Dringend";
    default:
      return priority;
  }
}

export const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary/20 text-secondary",
  high: "bg-warning/20 text-warning-foreground",
  urgent: "bg-destructive/20 text-destructive",
};

export const statusColumns: { id: TaskStatus; label: string; description: string }[] = [
  { id: "todo", label: "To Do", description: "Neue Aufgaben" },
  { id: "in-progress", label: "In Arbeit", description: "Aktive Bearbeitung" },
  { id: "review", label: "Awaiting Review", description: "Freigabe & Prüfung" },
  { id: "done", label: "Completed", description: "Abgeschlossen" },
];

export function getAssigneeName(id?: string) {
  if (!id) return "Unzugewiesen";
  return employees.find((employee) => employee.id === id)?.name ?? "Unbekannt";
}

export function getGeneralTasksForEmployee(tasks: GeneralEmployeeTask[], employeeId: string) {
  return tasks.filter((task) => task.employeeId === employeeId);
}

export function describeCadence(cadence: GeneralTaskCadence) {
  switch (cadence) {
    case "daily":
      return "täglich";
    case "weekly":
      return "wöchentlich";
    case "monthly":
      return "monatlich";
    case "once":
    default:
      return "einmalig";
  }
}
export type { GeneralEmployeeTask, GeneralTaskCadence, SopChecklist };





