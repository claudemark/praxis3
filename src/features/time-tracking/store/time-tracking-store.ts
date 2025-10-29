import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  initialClockRecords,
  initialShiftAssignments,
  initialVacationRequests,
  initialSickLeaves,
  initialCalendarDays,
  type ClockEvent,
  type DailyClockRecord,
  type DeviceType,
  type ShiftAssignment,
  type VacationRequest,
  type SickLeave,
  type CalendarDayEntry,
} from "@/data/time-tracking";

export const scheduledBreakDayIndices = [1, 2, 4] as const;
export const scheduledBreakMinutes = 120;
const scheduledBreakDaySet = new Set<number>(scheduledBreakDayIndices);

export interface ComputedRecord extends DailyClockRecord {
  workedMinutes: number;
  breakMinutes: number;
  automaticBreakDetected: boolean;
  scheduledBreakMinutes: number;
  pendingBreakMinutes: number;
  ignoredBreakMinutes: number;
  recordedBreakMinutes: number;
}

export type CalendarDayPayload = Omit<
  CalendarDayEntry,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface TimeTrackingState {
  clockRecords: DailyClockRecord[];
  shiftAssignments: ShiftAssignment[];
  vacationRequests: VacationRequest[];
  sickLeaves: SickLeave[];
  calendarDays: CalendarDayEntry[];
  clockIn: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  clockOut: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  startBreak: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  endBreak: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  moveShift: (shiftId: string, slot: "morning" | "day" | "evening") => void;
  updateShiftStatus: (shiftId: string, status: ShiftAssignment["status"]) => void;
  submitVacationRequest: (payload: { employeeId: string; from: string; to: string; comment?: string }) => void;
  updateVacationStatus: (id: string, status: VacationRequest["status"]) => void;
  submitSickLeave: (payload: { employeeId: string; from: string; to: string; documentUrl?: string }) => void;
  updateSickLeaveStatus: (id: string, status: SickLeave["status"], documentUrl?: string) => void;
  removeShift: (shiftId: string) => void;
  deleteClockEvent: (recordId: string, eventId: string) => void;
  deleteClockRecord: (recordId: string) => void;
  deleteVacationRequest: (id: string) => void;
  deleteSickLeave: (id: string) => void;
  addCalendarDay: (payload: CalendarDayPayload) => CalendarDayEntry;
  updateCalendarDay: (id: string, changes: Partial<Omit<CalendarDayEntry, "id">>) => void;
  deleteCalendarDay: (id: string) => void;
}

export const useTimeTrackingStore = create<TimeTrackingState>((set) => ({
  clockRecords: initialClockRecords,
  shiftAssignments: initialShiftAssignments,
  vacationRequests: initialVacationRequests,
  sickLeaves: initialSickLeaves,
  calendarDays: initialCalendarDays,
  clockIn: ({ employeeId, device, location }) =>
    set((state) => ({
      clockRecords: upsertClockEvent(state.clockRecords, employeeId, {
        id: nanoid(),
        type: "clock-in",
        timestamp: new Date().toISOString(),
        device,
        location,
      }),
    })),
  clockOut: ({ employeeId, device, location }) =>
    set((state) => ({
      clockRecords: upsertClockEvent(state.clockRecords, employeeId, {
        id: nanoid(),
        type: "clock-out",
        timestamp: new Date().toISOString(),
        device,
        location,
      }),
    })),
  startBreak: ({ employeeId, device, location }) =>
    set((state) => ({
      clockRecords: upsertClockEvent(state.clockRecords, employeeId, {
        id: nanoid(),
        type: "break-start",
        timestamp: new Date().toISOString(),
        device,
        location,
      }),
    })),
  endBreak: ({ employeeId, device, location }) =>
    set((state) => ({
      clockRecords: upsertClockEvent(state.clockRecords, employeeId, {
        id: nanoid(),
        type: "break-end",
        timestamp: new Date().toISOString(),
        device,
        location,
      }),
    })),
  moveShift: (shiftId, slot) =>
    set((state) => ({
      shiftAssignments: state.shiftAssignments.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              slot,
              status: slot === "day" ? shift.status : "geplant",
            }
          : shift,
      ),
    })),
  updateShiftStatus: (shiftId, status) =>
    set((state) => ({
      shiftAssignments: state.shiftAssignments.map((shift) =>
        shift.id === shiftId ? { ...shift, status } : shift,
      ),
    })),
  submitVacationRequest: ({ employeeId, from, to, comment }) =>
    set((state) => ({
      vacationRequests: [
        ...state.vacationRequests,
        {
          id: nanoid(),
          employeeId,
          from,
          to,
          comment,
          status: "Neu",
        },
      ],
    })),
  updateVacationStatus: (id, status) =>
    set((state) => ({
      vacationRequests: state.vacationRequests.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    })),
  submitSickLeave: ({ employeeId, from, to, documentUrl }) =>
    set((state) => ({
      sickLeaves: [
        ...state.sickLeaves,
        {
          id: nanoid(),
          employeeId,
          from,
          to,
          documentUrl,
          status: documentUrl ? "Bestätigt" : "Gemeldet",
        },
      ],
    })),
  updateSickLeaveStatus: (id, status, documentUrl) =>
    set((state) => ({
      sickLeaves: state.sickLeaves.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status,
              documentUrl: documentUrl ?? entry.documentUrl,
            }
          : entry,
      ),
    })),
  removeShift: (shiftId) =>
    set((state) => ({
      shiftAssignments: state.shiftAssignments.filter((shift) => shift.id !== shiftId),
    })),
  deleteClockEvent: (recordId, eventId) =>
    set((state) => ({
      clockRecords: state.clockRecords
        .map((record) =>
          record.id === recordId
            ? { ...record, events: record.events.filter((event) => event.id !== eventId) }
            : record,
        )
        .filter((record) => record.events.length > 0),
    })),
  deleteClockRecord: (recordId) =>
    set((state) => ({
      clockRecords: state.clockRecords.filter((record) => record.id !== recordId),
    })),
  deleteVacationRequest: (id) =>
    set((state) => ({
      vacationRequests: state.vacationRequests.filter((request) => request.id !== id),
    })),
  deleteSickLeave: (id) =>
    set((state) => ({
      sickLeaves: state.sickLeaves.filter((entry) => entry.id !== id),
    })),
  addCalendarDay: ({ id, date, label, type, description, createdBy, createdAt, updatedAt }) => {
    const entry: CalendarDayEntry = {
      id: id?.trim() || `cal-${nanoid(6)}`,
      date,
      label: label.trim(),
      type,
      description: description?.trim() || undefined,
      createdBy: createdBy?.trim() || undefined,
      createdAt: createdAt ?? new Date().toISOString(),
      updatedAt,
    };
    set((state) => ({ calendarDays: [entry, ...state.calendarDays] }));
    return entry;
  },
  updateCalendarDay: (id, changes) =>
    set((state) => ({
      calendarDays: state.calendarDays.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...changes,
              label: changes.label?.trim() ?? entry.label,
              description: changes.description?.trim() || entry.description,
              createdBy: changes.createdBy?.trim() || entry.createdBy,
              updatedAt: changes.updatedAt ?? new Date().toISOString(),
            }
          : entry,
      ),
    })),
  deleteCalendarDay: (id) =>
    set((state) => ({
      calendarDays: state.calendarDays.filter((entry) => entry.id !== id),
    })),
}));

export function computeDailyRecord(record: DailyClockRecord): ComputedRecord {
  const sortedEvents = [...record.events].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let workedMinutes = 0;
  let breakMinutes = 0;
  let lastClockIn: string | null = null;
  let breakStart: string | null = null;
  let automaticBreakDetected = false;

  for (const event of sortedEvents) {
    if (event.type === "clock-in") {
      lastClockIn = event.timestamp;
    }
    if (event.type === "break-start") {
      if (lastClockIn) {
        workedMinutes += diffMinutes(lastClockIn, event.timestamp);
      }
      breakStart = event.timestamp;
      lastClockIn = null;
    }
    if (event.type === "break-end" && breakStart) {
      breakMinutes += diffMinutes(breakStart, event.timestamp);
      lastClockIn = event.timestamp;
      breakStart = null;
    }
    if (event.type === "clock-out") {
      if (lastClockIn) {
        workedMinutes += diffMinutes(lastClockIn, event.timestamp);
        lastClockIn = null;
      }
    }
  }

  const recordDate = new Date(`${record.date}T00:00:00`);
  const validDate = Number.isNaN(recordDate.getTime()) ? new Date() : recordDate;
  const dayIndex = validDate.getDay();
  const isScheduledBreakDay = scheduledBreakDaySet.has(dayIndex);
  const scheduledMinutes = isScheduledBreakDay ? scheduledBreakMinutes : 0;

  const recordedBreakMinutes = breakMinutes;
  let pendingBreakMinutes = Math.max(0, scheduledMinutes - recordedBreakMinutes);
  let ignoredBreakMinutes = 0;

  if (isScheduledBreakDay) {
    if (recordedBreakMinutes < scheduledMinutes) {
      automaticBreakDetected = true;
      const missing = scheduledMinutes - recordedBreakMinutes;
      workedMinutes = Math.max(0, workedMinutes - missing);
    } else if (recordedBreakMinutes > scheduledMinutes) {
      const extra = recordedBreakMinutes - scheduledMinutes;
      workedMinutes += extra;
    }
    breakMinutes = scheduledMinutes;
  } else if (recordedBreakMinutes > 0) {
    ignoredBreakMinutes = recordedBreakMinutes;
    workedMinutes += recordedBreakMinutes;
    breakMinutes = 0;
  }

  pendingBreakMinutes = Math.max(0, scheduledMinutes - recordedBreakMinutes);

  return {
    ...record,
    events: sortedEvents,
    workedMinutes,
    breakMinutes,
    automaticBreakDetected,
    scheduledBreakMinutes: scheduledMinutes,
    pendingBreakMinutes,
    ignoredBreakMinutes,
    recordedBreakMinutes,
  };
}
function diffMinutes(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.max(0, Math.round((end - start) / 60000));
}

function upsertClockEvent(
  records: DailyClockRecord[],
  employeeId: string,
  event: ClockEvent,
): DailyClockRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  const existing = records.find(
    (record) => record.employeeId === employeeId && record.date === today,
  );

  if (!existing) {
    return [
      ...records,
      {
        id: `clock-${employeeId}-${today}`,
        employeeId,
        date: today,
        events: [event],
      },
    ];
  }

  return records.map((record) =>
    record === existing
      ? {
          ...record,
          events: [...record.events, event],
        }
      : record,
  );
}

