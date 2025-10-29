import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Flame,
  MessageCircle,
  PenLine,
  Plus,
  RefreshCw,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployeeDirectory, type EmployeeProfile } from "@/features/employees/store/employee-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/datetime";
import {
  getAssigneeName,
  getPriorityLabel,
  priorityStyles,
  statusColumns,
  getGeneralTasksForEmployee,
  describeCadence,
  type GeneralEmployeeTask,
  type GeneralTaskCadence,
  type RecurrenceRule,
  type SopChecklist,
  type TaskItem,
  type TaskPriority,
  type TaskStatus,
  useTaskStore,
} from "@/features/tasks/store/task-store";

interface ColumnProps {
  columnId: TaskStatus;
  label: string;
  description: string;
  tasks: TaskItem[];
  onSelectTask: (task: TaskItem) => void;
}

const currentUserId = "emp-linde";

export function TaskBoardPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const generalTasks = useTaskStore((state) => state.generalTasks);
  const sopChecklists = useTaskStore((state) => state.sopChecklists);
  const addSopChecklist = useTaskStore((state) => state.addSopChecklist);
  const updateSopChecklist = useTaskStore((state) => state.updateSopChecklist);
  const deleteSopChecklist = useTaskStore((state) => state.deleteSopChecklist);
  const addGeneralTask = useTaskStore((state) => state.addGeneralTask);
  const updateGeneralTask = useTaskStore((state) => state.updateGeneralTask);
  const deleteGeneralTask = useTaskStore((state) => state.deleteGeneralTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);
  const employees = useEmployeeDirectory((state) => state.employees);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSopModal, setShowSopModal] = useState(false);
  const [editingSopId, setEditingSopId] = useState<string | null>(null);
  const [showGeneralTaskModal, setShowGeneralTaskModal] = useState(false);
  const [editingGeneralTaskId, setEditingGeneralTaskId] = useState<string | null>(null);
  const [selectedGeneralEmployeeId, setSelectedGeneralEmployeeId] = useState(() => employees[0]?.id ?? "");

  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees]);
  const employeeLookup = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);

  useEffect(() => {
    if (!activeEmployees.length) {
      setSelectedGeneralEmployeeId("");
      return;
    }
    if (!selectedGeneralEmployeeId || !activeEmployees.some((employee) => employee.id === selectedGeneralEmployeeId)) {
      setSelectedGeneralEmployeeId(activeEmployees[0]!.id);
    }
  }, [activeEmployees, selectedGeneralEmployeeId]);

  const filteredGeneralTasks = useMemo(() => {
    if (!selectedGeneralEmployeeId) {
      return generalTasks;
    }
    return getGeneralTasksForEmployee(generalTasks, selectedGeneralEmployeeId);
  }, [generalTasks, selectedGeneralEmployeeId]);

  const editingSop = useMemo(
    () => (editingSopId ? sopChecklists.find((entry) => entry.id === editingSopId) ?? null : null),
    [editingSopId, sopChecklists],
  );

  const editingGeneralTask = useMemo(
    () => (editingGeneralTaskId ? generalTasks.find((entry) => entry.id === editingGeneralTaskId) ?? null : null),
    [editingGeneralTaskId, generalTasks],
  );


  const groupedTasks = useMemo(() => {
    return statusColumns.reduce<Record<TaskStatus, TaskItem[]>>((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id);
      return acc;
    }, { "todo": [], "in-progress": [], review: [], done: [] });
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const targetColumnId = (over.data.current?.columnId ?? over.id) as TaskStatus | string;
    const originatingColumnId = active.data.current?.columnId as TaskStatus | undefined;

    if (!targetColumnId || targetColumnId === originatingColumnId) {
      return;
    }

    if (["todo", "in-progress", "review", "done"].includes(targetColumnId)) {
      updateTaskStatus(taskId, targetColumnId as TaskStatus);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">Operationssteuerung</h1>
          <p className="text-sm text-muted-foreground">
            Aufgabenverwaltung mit Drag & Drop, Team-Kommunikation und automatischen Wiederholungen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-full">
            <RefreshCw className="size-4" /> Automatisch synchronisieren
          </Button>
          <Button className="gap-2 rounded-full" onClick={() => setShowCreateModal(true)}>
            <Plus className="size-4" /> Neue Aufgabe
          </Button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[3fr_1fr]">
        <Card className="overflow-hidden border border-border/40 bg-white/80 shadow-soft">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle>Kanban Board</CardTitle>
            <CardDescription>Drag & Drop zwischen Status-Spalten, inklusive Priorisierung & Wiederholungen.</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statusColumns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    columnId={column.id}
                    label={column.label}
                    description={column.description}
                    tasks={groupedTasks[column.id]}
                    onSelectTask={(task) => setSelectedTaskId(task.id)}
                  />
                ))}
              </div>
            </DndContext>
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card glow>
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>SOP Checklisten</CardTitle>
                <CardDescription>Abläufe & Verantwortlichkeiten im Team</CardDescription>
              </div>
              <Button size="xs" className="gap-1 rounded-full" onClick={() => { setEditingSopId(null); setShowSopModal(true); }}>
                <Plus className="size-3" /> Neue SOP
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sopChecklists.length ? (
                sopChecklists.map((sop) => {
                  const ownerProfile = employeeLookup.get(sop.ownerId);
                  const ownerName = ownerProfile?.name ?? "Unbekannt";
                  const ownerRole = ownerProfile?.role;
                  const ownerRoleLabel = ownerRole ? ` • ${ownerRole}` : "";
                  return (
                    <div key={sop.id} className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground/90">{sop.name}</p>
                          <p className="text-xs text-muted-foreground/80">Verantwortlich: {ownerName}{ownerRoleLabel}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="success" size="sm">{Math.round(sop.compliance * 100)}%</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setEditingSopId(sop.id);
                              setShowSopModal(true);
                            }}
                          >
                            <PenLine className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteSopChecklist(sop.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                        {sop.steps.map((step) => (
                          <li key={step} className="flex items-center gap-2">
                            <span className="inline-flex size-2 rounded-full bg-primary/70" />
                            {step}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground/60">
                        <span>Letztes Audit: {formatDate(sop.lastAudit)}</span>
                        {sop.category ? (
                          <span className="rounded-full border border-primary/40 px-2 py-0.5 text-primary/80">{sop.category}</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground/80">Noch keine SOP angelegt. Lege deine erste Checkliste an.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between">
              <div>
                <CardTitle>Standardaufgaben</CardTitle>
                <CardDescription>Wiederkehrende Verantwortlichkeiten je Mitarbeitendem</CardDescription>
              </div>
              <Button
                size="xs"
                variant="outline"
                className="gap-1 rounded-full"
                onClick={() => {
                  setEditingGeneralTaskId(null);
                  setShowGeneralTaskModal(true);
                }}
              >
                <Plus className="size-3" /> Aufgabe
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEmployees.length ? (
                <>
                  <div>
                    <label className="text-xs font-medium uppercase text-muted-foreground/70">Teammitglied</label>
                    <select
                      value={selectedGeneralEmployeeId}
                      onChange={(event) => setSelectedGeneralEmployeeId(event.target.value)}
                      className="mt-1 w-full rounded-md border border-border/50 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      {activeEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    {filteredGeneralTasks.length ? (
                      filteredGeneralTasks.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-border/50 bg-white/90 p-3 shadow-xs">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground/90">{entry.title}</p>
                              {entry.description ? (
                                <p className="text-xs text-muted-foreground/80">{entry.description}</p>
                              ) : null}
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
                                <Badge variant="outline" size="sm">{describeCadence(entry.cadence)}</Badge>
                                <span>{entry.active ? "Aktiv" : "Pausiert"}</span>
                                <span>•</span>
                                <span>seit {formatDate(entry.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingGeneralTaskId(entry.id);
                                  setShowGeneralTaskModal(true);
                                }}
                              >
                                <PenLine className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => deleteGeneralTask(entry.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground/75">Keine Standardaufgaben für das gewählte Teammitglied.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground/75">Keine aktiven Mitarbeiter:innen vorhanden.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automation Pulse</CardTitle>
              <CardDescription>Wiederkehrende Aufgaben & KI-Automatismen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center justify-between">
                <span>
                  <Repeat className="mr-2 inline size-4 text-primary" /> Wiederkehrende Tasks
                </span>
                <Badge variant="muted" size="sm">
                  {tasks.filter((task) => task.recurrence).length}
                </Badge>
              </p>
              <p className="flex items-center justify-between">
                <span>
                  <MessageCircle className="mr-2 inline size-4 text-secondary" /> Kommentare heute
                </span>
                <Badge size="sm" variant="muted">
                  {tasks.reduce((acc, task) => acc + task.comments.length, 0)}
                </Badge>
              </p>
              <p className="flex items-center justify-between">
                <span>
                  <CheckSquare className="mr-2 inline size-4 text-success" /> Abgehakte Checklisten
                </span>
                <Badge size="sm" variant="success">
                  {tasks.reduce(
                    (acc, task) => acc + (task.checklist?.filter((item) => item.completed).length ?? 0),
                    0,
                  )}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      {showCreateModal ? (
        <TaskCreationModal onClose={() => setShowCreateModal(false)} />
      ) : null}

      {showSopModal ? (
        <SopChecklistModal
          initial={editingSop}
          onClose={() => {
            setShowSopModal(false);
            setEditingSopId(null);
          }}
          onSubmit={(payload) => {
            if (editingSop) {
              updateSopChecklist(editingSop.id, payload);
            } else {
              addSopChecklist(payload);
            }
            setShowSopModal(false);
            setEditingSopId(null);
          }}
          onDelete={editingSop
            ? () => {
                deleteSopChecklist(editingSop.id);
                setShowSopModal(false);
                setEditingSopId(null);
              }
            : undefined}
        />
      ) : null}

      {showGeneralTaskModal ? (
        <GeneralTaskModal
          initial={editingGeneralTask}
          employees={activeEmployees}
          defaultEmployeeId={selectedGeneralEmployeeId || activeEmployees[0]?.id || ""}
          onClose={() => {
            setShowGeneralTaskModal(false);
            setEditingGeneralTaskId(null);
          }}
          onSubmit={(payload) => {
            if (editingGeneralTask) {
              updateGeneralTask(editingGeneralTask.id, payload);
            } else {
              addGeneralTask(payload);
            }
            setSelectedGeneralEmployeeId(payload.employeeId);
            setShowGeneralTaskModal(false);
            setEditingGeneralTaskId(null);
          }}
          onDelete={editingGeneralTask
            ? () => {
                deleteGeneralTask(editingGeneralTask.id);
                setShowGeneralTaskModal(false);
                setEditingGeneralTaskId(null);
              }
            : undefined}
        />
      ) : null}

      {selectedTask ? (
        <TaskDetailDrawer task={selectedTask} onClose={() => setSelectedTaskId(null)} />
      ) : null}
    </div>
  );
}

function KanbanColumn({ columnId, label, description, tasks, onSelectTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { columnId },
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-surface-100 text-muted-foreground/80">
            <Flame className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground/85">{label}</p>
            <p className="text-xs text-muted-foreground/70">{description}</p>
          </div>
        </div>
        <Badge size="sm" variant="muted">
          {tasks.length}
        </Badge>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-[180px] flex-col gap-3 rounded-2xl border border-border/40 bg-gradient-to-br p-3 transition",
            columnBackground(columnId),
            isOver && "border-primary/50 bg-primary/10",
          )}
        >
          {tasks.length === 0 ? (
            <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-border/50 bg-white/70 p-4 text-center text-xs text-muted-foreground">
              Keine Aufgaben – ziehen Sie Aufgaben hierher.
            </div>
          ) : null}
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onSelect={() => onSelectTask(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function columnBackground(status: TaskStatus) {
  switch (status) {
    case "todo":
      return "from-surface-50 via-surface-100 to-surface-50";
    case "in-progress":
      return "from-primary/5 via-primary/10 to-surface-50";
    case "review":
      return "from-secondary/5 via-secondary/10 to-surface-50";
    case "done":
      return "from-success/5 via-success/10 to-surface-50";
    default:
      return "from-surface-50 to-surface-100";
  }
}

function SortableTaskCard({ task, onSelect }: { task: TaskItem; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { columnId: task.status },
  });
  const employees = useEmployeeDirectory((state) => state.employees);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = employees.find((employee) => employee.id === task.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex cursor-grab flex-col gap-3 rounded-xl border border-border/40 bg-white/95 p-4 shadow-sm transition",
        "hover:border-primary/30 hover:shadow-lg",
        isDragging && "z-10 border-primary/40 shadow-xl",
      )}
      onClick={onSelect}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between text-xs">
        <Badge size="sm" className={priorityStyles[task.priority]}>
          {getPriorityLabel(task.priority)}
        </Badge>
        <span className="text-muted-foreground/70">{task.id}</span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground/90">{task.title}</h3>
        <p className="text-xs text-muted-foreground/80">{task.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
        <span>Fällig {formatDateTime(task.dueDate)}</span>
        {task.recurrence ? (
          <Badge size="sm" variant="muted" className="gap-1 border-dashed">
            <Repeat className="size-3" /> {task.recurrence.pattern}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground/70">
        <div className="flex items-center gap-2">
          <Avatar name={assignee?.name ?? "Unzugewiesen"} size="xs" />
          <span>{assignee?.name ?? "Unzugewiesen"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>💬 {task.comments.length}</span>
          <span>✅ {task.checklist?.filter((item) => item.completed).length ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

function TaskCreationModal({ onClose }: { onClose: () => void }) {
  const createTask = useTaskStore((state) => state.createTask);
  const employees = useEmployeeDirectory((state) => state.employees);
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(activeEmployees[0]?.id ?? "");
  const [tags, setTags] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [pattern, setPattern] = useState<RecurrenceRule["pattern"]>("weekly");

  useEffect(() => {
    if (!activeEmployees.length) {
      setAssigneeId("");
      return;
    }
    if (!assigneeId || !activeEmployees.some((employee) => employee.id === assigneeId)) {
      setAssigneeId(activeEmployees[0]!.id);
    }
  }, [activeEmployees, assigneeId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    createTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: new Date(dueDate).toISOString(),
      assigneeId: assigneeId || undefined,
      tags: parsedTags.length ? parsedTags : undefined,
      recurrence: isRecurring
        ? {
            pattern,
            nextOccurrence: new Date(dueDate).toISOString(),
          }
        : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-2xl border border-border/40 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>Neue Aufgabe erstellen</CardTitle>
          <CardDescription>Titel, Beschreibung, Priorität, Fälligkeit & Zuständigkeit festlegen.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Titel</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Kurzbeschreibung" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Beschreibung</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Details, Kontext, SOP-Verweise" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Fälligkeit</label>
                <Input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Zuständigkeit</label>
                <select
                  value={assigneeId}
                  onChange={(event) => setAssigneeId(event.target.value)}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Unzugewiesen</option>
                  {activeEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Priorität</label>
                <div className="flex flex-wrap gap-2">
                  {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((level) => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setPriority(level)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition",
                        priority === level
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                      )}
                    >
                      {getPriorityLabel(level)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Tags (Komma getrennt)</label>
                <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="z.B. Lager, SOP, KI" />
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-surface-100/60 p-3">
              <div className="flex items-center justify-between text-sm font-medium text-foreground/80">
                <span>Wiederkehrende Aufgabe</span>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
              {isRecurring ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground/70">Intervall</label>
                    <select
                      value={pattern}
                      onChange={(event) => setPattern(event.target.value as RecurrenceRule["pattern"])}
                      className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="daily">Täglich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="monthly">Monatlich</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-border/40 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="gap-2 rounded-full">
              <CheckSquare className="size-4" /> Aufgabe anlegen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TaskDetailDrawer({ task, onClose }: { task: TaskItem; onClose: () => void }) {
  const employees = useEmployeeDirectory((state) => state.employees);
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const addComment = useTaskStore((state) => state.addComment);
  const toggleChecklistItem = useTaskStore((state) => state.toggleChecklistItem);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    title: task.title,
    description: task.description,
    dueDate: task.dueDate.slice(0, 16),
    priority: task.priority,
    status: task.status,
    assigneeId: task.assigneeId ?? "",
    tags: task.tags?.join(", ") ?? "",
  }));

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.slice(0, 16),
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId ?? "",
      tags: task.tags?.join(", ") ?? "",
    });
    setIsEditing(false);
  }, [task]);

  const toIsoString = (value: string) => {
    if (!value) return task.dueDate;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return task.dueDate;
    }
    return date.toISOString();
  };

  const previewDueDate = isEditing ? toIsoString(form.dueDate) : task.dueDate;

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!comment.trim()) return;
    addComment(task.id, currentUserId, comment.trim());
    setComment("");
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const parsedTags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    updateTask(task.id, {
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: toIsoString(form.dueDate),
      priority: form.priority,
      status: form.status,
      assigneeId: form.assigneeId || undefined,
      tags: parsedTags.length ? parsedTags : undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm("Aufgabe wirklich löschen?")) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setForm({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate.slice(0, 16),
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId ?? "",
        tags: task.tags?.join(", ") ?? "",
      });
    }
    setIsEditing((prev) => !prev);
  };

  const priorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg overflow-y-auto border-l border-border/40 bg-white/95 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-6 py-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground/70">Task Detail</p>
          <h2 className="text-xl font-semibold text-foreground/90">{isEditing ? form.title : task.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleEditToggle}>
            {isEditing ? (
              <>
                <X className="size-4" /> Abbrechen
              </>
            ) : (
              <>
                <PenLine className="size-4" /> Bearbeiten
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" /> Löschen
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <Badge size="sm" className={priorityStyles[isEditing ? form.priority : task.priority]}>
            {getPriorityLabel(isEditing ? form.priority : task.priority)}
          </Badge>
          <Badge size="sm" variant="muted">
            {(() => {
              const status = isEditing ? form.status : task.status;
              if (status === "review") return "Awaiting Review";
              if (status === "in-progress") return "In Arbeit";
              if (status === "done") return "Abgeschlossen";
              return "To Do";
            })()}
          </Badge>
          <span>Erstellt am {formatDate(task.createdAt)}</span>
          <span>Fällig {formatDateTime(previewDueDate)}</span>
        </div>

        {isEditing ? (
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Titel</label>
              <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Beschreibung</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Aufgabe erläutern, SOPs oder Links ergänzen"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Fälligkeit</label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Priorität</label>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {getPriorityLabel(priority)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {statusColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Zuständigkeit</label>
                <select
                  value={form.assigneeId}
                  onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Unzugewiesen</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} • {employee.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Tags (Komma getrennt)</label>
              <Input
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="z.B. Lager, SOP, KI"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleEditToggle}>
                Abbrechen
              </Button>
              <Button type="submit" className="gap-2 rounded-full">
                <CheckSquare className="size-4" /> Änderungen speichern
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground/90">{task.description}</p>
            <div className="rounded-xl border border-border/40 bg-surface-100/70 p-4">
              <p className="text-sm font-semibold text-foreground/85">Zuständigkeit</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={getAssigneeName(task.assigneeId)} size="sm" />
                <select
                  value={task.assigneeId ?? ""}
                  onChange={(event) => updateTask(task.id, { assigneeId: event.target.value || undefined })}
                  className="flex-1 rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Unzugewiesen</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} • {employee.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {task.tags && task.tags.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/80">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            {task.recurrence ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
                <p className="font-semibold text-primary">Wiederkehrende Aufgabe</p>
                <p className="text-muted-foreground/80">
                  Intervall: {task.recurrence.pattern} • nächste Erstellung am {formatDate(task.recurrence.nextOccurrence)}
                </p>
              </div>
            ) : null}
          </>
        )}

        {task.checklist && task.checklist.length ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground/85">Checklist</p>
            <div className="space-y-2">
              {task.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(task.id, item.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                    item.completed
                      ? "border-success/40 bg-success/10 text-success-foreground"
                      : "border-border/50 bg-white/80 text-muted-foreground/90 hover:border-primary/30 hover:bg-primary/5",
                  )}
                >
                  <span>{item.label}</span>
                  <span>{item.completed ? "Erledigt" : "Offen"}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground/85">Kommentare</p>
          <div className="space-y-2">
            {task.comments.map((entry) => {
              const author = employees.find((employee) => employee.id === entry.authorId);
              return (
                <div key={entry.id} className="flex gap-3 rounded-lg border border-border/40 bg-white/90 p-3 text-sm">
                  <Avatar name={author?.name ?? "Teammitglied"} size="xs" />
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
                      <span>{author?.name ?? "Teammitglied"}</span>
                      <span>•</span>
                      <span>{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{entry.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <Input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Kommentar hinzufügen..."
            />
            <Button type="submit" className="gap-2">
              <MessageCircle className="size-4" /> Posten
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SopChecklistModal({
  initial,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial: SopChecklist | null;
  onSubmit: (payload: { name: string; ownerId: string; category?: string; description?: string; steps: string[]; lastAudit: string; compliance: number }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const employees = useEmployeeDirectory((state) => state.employees);
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.active), [employees]);
  const [ownerId, setOwnerId] = useState(() => initial?.ownerId ?? activeEmployees[0]?.id ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [steps, setSteps] = useState(initial ? initial.steps.join("\n") : "");
  const [lastAudit, setLastAudit] = useState(initial?.lastAudit ?? new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (initial?.ownerId) {
      setOwnerId(initial.ownerId);
      return;
    }
    if (!activeEmployees.length) {
      setOwnerId("");
      return;
    }
    setOwnerId((previous) => {
      if (previous && activeEmployees.some((employee) => employee.id === previous)) {
        return previous;
      }
      return activeEmployees[0]!.id;
    });
  }, [initial, activeEmployees]);
  const [compliance, setCompliance] = useState(() => String(initial ? Math.round(initial.compliance * 100) : 100));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !ownerId) {
      return;
    }
    const complianceNumber = Math.min(100, Math.max(0, Number(compliance.replace(/,/, ".")) || 0));
    const normalizedSteps = steps.replace(/\r?\n/g, "\n");
    const payload = {
      name: name.trim(),
      ownerId,
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      steps: normalizedSteps
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
      lastAudit,
      compliance: complianceNumber / 100,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-xl border border-border/40 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>{initial ? "SOP bearbeiten" : "Neue SOP Checkliste"}</CardTitle>
          <CardDescription>Schritte, Verantwortliche und Audit-Informationen verwalten.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} required placeholder="z. B. Prä-OP Knie" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Owner</label>
                <select
                  value={ownerId}
                  onChange={(event) => setOwnerId(event.target.value)}
                  required
                  className="w-full rounded-md border border-border/60 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="" disabled>Verantwortliche Person wählen</option>
                  {activeEmployees.map((employee) => {
                    const roleLabel = employee.role ? ` • ${employee.role}` : "";
                    return (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}{roleLabel}
                      </option>
                    );
                  })}
                </select>
                {!activeEmployees.length ? (
                  <p className="text-[11px] text-muted-foreground/70">Keine aktiven Teammitglieder verfügbar. Bitte in den Einstellungen ein Mitglied aktivieren.</p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Kategorie</label>
                <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="z. B. OP, Nachsorge" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Letztes Audit</label>
                <Input type="date" value={lastAudit} onChange={(event) => setLastAudit(event.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Beschreibung</label>
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Kurzbeschreibung oder Hinweise" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Compliance (%)</label>
                <Input type="number" min={0} max={100} value={compliance} onChange={(event) => setCompliance(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Checklisten-Schritte</label>
              <Textarea
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                rows={6}
                placeholder="Jeder Schritt in neuer Zeile"
              />
            </div>
          </CardContent>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 px-6 py-4">
            {onDelete ? (
              <Button type="button" variant="ghost" className="gap-2 text-destructive" onClick={onDelete} disabled={!activeEmployees.length}>
                <Trash2 className="size-4" /> Löschen
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" className="gap-2 rounded-full">
                <CheckSquare className="size-4" /> Speichern
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

function GeneralTaskModal({
  initial,
  employees,
  defaultEmployeeId,
  onSubmit,
  onDelete,
  onClose,
}: {
  initial: GeneralEmployeeTask | null;
  employees: EmployeeProfile[];
  defaultEmployeeId: string;
  onSubmit: (payload: { employeeId: string; title: string; description?: string; cadence: GeneralTaskCadence; active: boolean }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? defaultEmployeeId);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [cadence, setCadence] = useState<GeneralTaskCadence>(initial?.cadence ?? "weekly");
  const [active, setActive] = useState(initial?.active ?? true);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !employeeId) {
      return;
    }
    onSubmit({
      employeeId,
      title: title.trim(),
      description: description.trim() || undefined,
      cadence,
      active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
      <Card className="w-full max-w-lg border border-border/40 bg-white/95 shadow-2xl">
        <CardHeader>
          <CardTitle>{initial ? "Aufgabe bearbeiten" : "Neue Standardaufgabe"}</CardTitle>
          <CardDescription>Regelmäßige Verantwortlichkeiten pro Teammitglied definieren.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Teammitglied</label>
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              >
                <option value="" disabled>
                  Teammitglied auswählen
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Titel</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="z. B. OP-Plan prüfen" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Beschreibung</label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Optionale Details" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Intervall</label>
                <select
                  value={cadence}
                  onChange={(event) => setCadence(event.target.value as GeneralTaskCadence)}
                  className="w-full rounded-md border border-border/50 bg-white/80 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="once">Einmalig</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-100/60 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground/80">Aktiv</p>
                  <p className="text-xs text-muted-foreground/70">Steuert Sichtbarkeit in Übersichten</p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </CardContent>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 px-6 py-4">
            {onDelete ? (
              <Button type="button" variant="ghost" className="gap-2 text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" /> Löschen
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" className="gap-2 rounded-full">
                <CheckSquare className="size-4" /> Speichern
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}




















