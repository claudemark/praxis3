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
import {
  fetchClockRecordsFromSupabase,
  createClockRecordInSupabase,
  updateClockRecordInSupabase,
  deleteClockRecordFromSupabase,
  fetchShiftAssignmentsFromSupabase,
  createShiftAssignmentInSupabase,
  updateShiftAssignmentInSupabase,
  deleteShiftAssignmentFromSupabase,
  fetchVacationRequestsFromSupabase,
  createVacationRequestInSupabase,
  updateVacationRequestInSupabase,
  deleteVacationRequestFromSupabase,
  fetchSickLeavesFromSupabase,
  createSickLeaveInSupabase,
  updateSickLeaveInSupabase,
  deleteSickLeaveFromSupabase,
  fetchCalendarDaysFromSupabase,
  createCalendarDayInSupabase,
  updateCalendarDayInSupabase,
  deleteCalendarDayFromSupabase,
} from "@/features/time-tracking/api/time-tracking-api";
import { isSupabaseConfigured } from "@/services/supabase-client";

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
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchTimeTracking: () => Promise<void>;
  persistCreateRecord: (record: DailyClockRecord) => Promise<DailyClockRecord>;
  persistUpdateRecord: (id: string, record: DailyClockRecord) => Promise<void>;
  persistDeleteRecord: (id: string) => Promise<void>;
  clockIn: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  clockOut: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  startBreak: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  endBreak: (opts: { employeeId: string; device: DeviceType; location: string }) => void;
  moveShift: (shiftId: string, slot: "morning" | "day" | "evening") => void;
  updateShiftStatus: (shiftId: string, status: ShiftAssignment["status"]) => void;
  submitVacationRequest: (payload: {
    employeeId: string;
    from: string;
    to: string;
    status?: VacationRequest["status"];
    comment?: string;
  }) => VacationRequest;
  updateVacationRequest: (id: string, changes: Partial<Omit<VacationRequest, "id">>) => void;
  updateVacationStatus: (id: string, status: VacationRequest["status"]) => void;
  submitSickLeave: (payload: {
    employeeId: string;
    from: string;
    to: string;
    status?: SickLeave["status"];
    documentUrl?: string;
  }) => SickLeave;
  updateSickLeave: (id: string, changes: Partial<Omit<SickLeave, "id">>) => void;
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

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => {
  const persistCreateVacationRequest = async (request: VacationRequest) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip creating vacation request - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting vacation request:", request.id);
      await createVacationRequestInSupabase(request);
      console.log("[TimeTracking Store] Vacation request persisted:", request.id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist vacation request:", error);
    }
  };

  const persistUpdateVacationRequest = async (id: string, changes: Partial<VacationRequest>) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip updating vacation request - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting vacation request update:", id, changes);
      await updateVacationRequestInSupabase(id, changes);
      console.log("[TimeTracking Store] Vacation request update persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist vacation request update:", error);
    }
  };

  const persistDeleteVacationRequest = async (id: string) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip deleting vacation request - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting vacation request deletion:", id);
      await deleteVacationRequestFromSupabase(id);
      console.log("[TimeTracking Store] Vacation request deletion persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist vacation request deletion:", error);
    }
  };

  const persistCreateSickLeave = async (entry: SickLeave) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip creating sick leave - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting sick leave:", entry.id);
      await createSickLeaveInSupabase(entry);
      console.log("[TimeTracking Store] Sick leave persisted:", entry.id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist sick leave:", error);
    }
  };

  const persistUpdateSickLeave = async (id: string, changes: Partial<SickLeave>) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip updating sick leave - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting sick leave update:", id, changes);
      await updateSickLeaveInSupabase(id, changes);
      console.log("[TimeTracking Store] Sick leave update persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist sick leave update:", error);
    }
  };

  const persistDeleteSickLeave = async (id: string) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip deleting sick leave - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting sick leave deletion:", id);
      await deleteSickLeaveFromSupabase(id);
      console.log("[TimeTracking Store] Sick leave deletion persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist sick leave deletion:", error);
    }
  };

  const persistCreateCalendarDay = async (entry: CalendarDayEntry) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip creating calendar day - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting calendar day:", entry.id);
      await createCalendarDayInSupabase(entry);
      console.log("[TimeTracking Store] Calendar day persisted:", entry.id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist calendar day:", error);
    }
  };

  const persistUpdateCalendarDay = async (id: string, changes: Partial<CalendarDayEntry>) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip updating calendar day - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting calendar day update:", id, changes);
      await updateCalendarDayInSupabase(id, changes);
      console.log("[TimeTracking Store] Calendar day update persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist calendar day update:", error);
    }
  };

  const persistDeleteCalendarDay = async (id: string) => {
    if (!isSupabaseConfigured) {
      console.log("[TimeTracking Store] Skip deleting calendar day - Supabase not configured");
      return;
    }
    try {
      console.log("[TimeTracking Store] Persisting calendar day deletion:", id);
      await deleteCalendarDayFromSupabase(id);
      console.log("[TimeTracking Store] Calendar day deletion persisted:", id);
    } catch (error) {
      console.error("[TimeTracking Store] Failed to persist calendar day deletion:", error);
    }
  };

  return {
  clockRecords: initialClockRecords,
  shiftAssignments: initialShiftAssignments,
  vacationRequests: initialVacationRequests,
  sickLeaves: initialSickLeaves,
  calendarDays: initialCalendarDays,
  isLoading: false,
  error: null,
  initialized: false,

  // ===========================
  // Supabase Sync
  // ===========================
  fetchTimeTracking: async () => {
    console.log("?? [TimeTracking Store] Starting fetchTimeTracking...");
    set({ isLoading: true, error: null });
    try {
      const [records, shifts, vacations, sickLeaves, calendarDays] = await Promise.all([
        fetchClockRecordsFromSupabase(),
        fetchShiftAssignmentsFromSupabase(),
        fetchVacationRequestsFromSupabase(),
        fetchSickLeavesFromSupabase(),
        fetchCalendarDaysFromSupabase(),
      ]);
      console.log("? [TimeTracking Store] Loaded all time tracking data:", {
        clockRecords: records.length,
        shifts: shifts.length,
        vacations: vacations.length,
        sickLeaves: sickLeaves.length,
        calendarDays: calendarDays.length,
      });
      set({
        clockRecords: records,
        shiftAssignments: shifts,
        vacationRequests: vacations,
        sickLeaves: sickLeaves,
        calendarDays: calendarDays,
        initialized: true,
        isLoading: false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch time tracking data";
      console.error("? [TimeTracking Store] fetchTimeTracking error:", errorMsg);
      set({ error: errorMsg, isLoading: false });
    }
  },

  // Helper: persist create
  persistCreateRecord: async (record: DailyClockRecord) => {
    try {
      console.log("?? [TimeTracking Store] Persisting new clock record:", record);
      const created = await createClockRecordInSupabase(record);
      console.log("? [TimeTracking Store] Clock record created in Supabase:", created.id);
      return created;
    } catch (err) {
      console.error("? [TimeTracking Store] persistCreateRecord error:", err);
      throw err;
    }
  },

  // Helper: persist update
  persistUpdateRecord: async (id: string, record: DailyClockRecord) => {
    try {
      console.log("?? [TimeTracking Store] Persisting update for clock record:", id);
      await updateClockRecordInSupabase(id, record);
      console.log("? [TimeTracking Store] Clock record updated in Supabase:", id);
    } catch (err) {
      console.error("? [TimeTracking Store] persistUpdateRecord error:", err);
      throw err;
    }
  },

  // Helper: persist delete
  persistDeleteRecord: async (id: string) => {
    try {
      console.log("?? [TimeTracking Store] Deleting clock record:", id);
      await deleteClockRecordFromSupabase(id);
      console.log("? [TimeTracking Store] Clock record deleted from Supabase:", id);
    } catch (err) {
      console.error("? [TimeTracking Store] persistDeleteRecord error:", err);
      throw err;
    }
  },

  // ===========================
  // Clock In/Out/Break
  // ===========================
  clockIn: ({ employeeId, device, location }) => {
    const state = get();
    set((currentState) => {
      const updatedRecords = upsertClockEvent(currentState.clockRecords, employeeId, {
        id: nanoid(),
        type: "clock-in",
        timestamp: new Date().toISOString(),
        device,
        location,
      });

      // Persist to Supabase
      const today = new Date().toISOString().slice(0, 10);
      const record = updatedRecords.find(
        (r) => r.employeeId === employeeId && r.date === today
      );
      if (record) {
        // Check if record exists in state (update) or is new (create)
        const existingRecord = currentState.clockRecords.find(
          (r) => r.id === record.id
        );
        if (existingRecord) {
          state.persistUpdateRecord(record.id, record).catch((err: Error) =>
            console.error("? Failed to persist clock-in update:", err)
          );
        } else {
          state.persistCreateRecord(record).catch((err: Error) =>
            console.error("? Failed to persist clock-in create:", err)
          );
        }
      }

      return { clockRecords: updatedRecords };
    });
  },
  clockOut: ({ employeeId, device, location }) => {
    const state = get();
    set((currentState) => {
      const updatedRecords = upsertClockEvent(currentState.clockRecords, employeeId, {
        id: nanoid(),
        type: "clock-out",
        timestamp: new Date().toISOString(),
        device,
        location,
      });

      // Persist to Supabase
      const today = new Date().toISOString().slice(0, 10);
      const record = updatedRecords.find(
        (r) => r.employeeId === employeeId && r.date === today
      );
      if (record) {
        const existingRecord = currentState.clockRecords.find(
          (r) => r.id === record.id
        );
        if (existingRecord) {
          state.persistUpdateRecord(record.id, record).catch((err: Error) =>
            console.error("? Failed to persist clock-out update:", err)
          );
        } else {
          state.persistCreateRecord(record).catch((err: Error) =>
            console.error("? Failed to persist clock-out create:", err)
          );
        }
      }

      return { clockRecords: updatedRecords };
    });
  },
  startBreak: ({ employeeId, device, location }) => {
    const state = get();
    set((currentState) => {
      const updatedRecords = upsertClockEvent(currentState.clockRecords, employeeId, {
        id: nanoid(),
        type: "break-start",
        timestamp: new Date().toISOString(),
        device,
        location,
      });

      // Persist to Supabase
      const today = new Date().toISOString().slice(0, 10);
      const record = updatedRecords.find(
        (r) => r.employeeId === employeeId && r.date === today
      );
      if (record) {
        const existingRecord = currentState.clockRecords.find(
          (r) => r.id === record.id
        );
        if (existingRecord) {
          state.persistUpdateRecord(record.id, record).catch((err: Error) =>
            console.error("? Failed to persist break-start update:", err)
          );
        } else {
          state.persistCreateRecord(record).catch((err: Error) =>
            console.error("? Failed to persist break-start create:", err)
          );
        }
      }

      return { clockRecords: updatedRecords };
    });
  },
  endBreak: ({ employeeId, device, location }) => {
    const state = get();
    set((currentState) => {
      const updatedRecords = upsertClockEvent(currentState.clockRecords, employeeId, {
        id: nanoid(),
        type: "break-end",
        timestamp: new Date().toISOString(),
        device,
        location,
      });

      // Persist to Supabase
      const today = new Date().toISOString().slice(0, 10);
      const record = updatedRecords.find(
        (r) => r.employeeId === employeeId && r.date === today
      );
      if (record) {
        const existingRecord = currentState.clockRecords.find(
          (r) => r.id === record.id
        );
        if (existingRecord) {
          state.persistUpdateRecord(record.id, record).catch((err: Error) =>
            console.error("? Failed to persist break-end update:", err)
          );
        } else {
          state.persistCreateRecord(record).catch((err: Error) =>
            console.error("? Failed to persist break-end create:", err)
          );
        }
      }

      return { clockRecords: updatedRecords };
    });
  },
  moveShift: (shiftId, slot) => {
    set((currentState) => {
      const updatedShifts = currentState.shiftAssignments.map((shift) =>
        shift.id === shiftId
          ? {
              ...shift,
              slot,
              status: (slot === "day" ? shift.status : "geplant") as "geplant" | "bestätigt" | "offen",
            }
          : shift,
      );
      
      // Persist to Supabase
      const updatedShift = updatedShifts.find((s) => s.id === shiftId);
      if (updatedShift) {
        updateShiftAssignmentInSupabase(shiftId, updatedShift).catch((err: Error) =>
          console.error("? Failed to persist shift move:", err)
        );
      }
      
      return { shiftAssignments: updatedShifts };
    });
  },
  updateShiftStatus: (shiftId, status) => {
    set((currentState) => {
      const updatedShifts = currentState.shiftAssignments.map((shift) =>
        shift.id === shiftId ? { ...shift, status } : shift,
      );
      
      // Persist to Supabase
      updateShiftAssignmentInSupabase(shiftId, { status }).catch((err: Error) =>
        console.error("? Failed to persist shift status update:", err)
      );
      
      return { shiftAssignments: updatedShifts };
    });
  },
  submitVacationRequest: ({ employeeId, from, to, status, comment }) => {
    const newRequest: VacationRequest = {
      id: nanoid(),
      employeeId,
      from,
      to,
      comment,
      status: status ?? "Neu",
    };
    set((state) => ({
      vacationRequests: [...state.vacationRequests, newRequest],
    }));
    void persistCreateVacationRequest(newRequest);
    return newRequest;
  },
  updateVacationRequest: (id, changes) => {
    set((state) => {
      return {
        vacationRequests: state.vacationRequests.map((request) =>
          request.id === id ? { ...request, ...changes } : request,
        ),
      };
    });
    void persistUpdateVacationRequest(id, changes);
  },
  updateVacationStatus: (id, status) => {
    set((state) => {
      return {
        vacationRequests: state.vacationRequests.map((request) =>
          request.id === id ? { ...request, status } : request,
        ),
      };
    });
    void persistUpdateVacationRequest(id, { status });
  },
  submitSickLeave: ({ employeeId, from, to, status, documentUrl }) => {
    const newLeave: SickLeave = {
      id: nanoid(),
      employeeId,
      from,
      to,
      documentUrl,
      status: status ?? (documentUrl ? "Best\u00e4tigt" : "Gemeldet"),
    };
    set((state) => ({
      sickLeaves: [...state.sickLeaves, newLeave],
    }));
    void persistCreateSickLeave(newLeave);
    return newLeave;
  },
  updateSickLeave: (id, changes) => {
    set((state) => {
      return {
        sickLeaves: state.sickLeaves.map((entry) =>
          entry.id === id ? { ...entry, ...changes } : entry,
        ),
      };
    });
    void persistUpdateSickLeave(id, changes);
  },
  updateSickLeaveStatus: (id, status, documentUrl) => {
    const updates = {
      status,
      ...(documentUrl !== undefined ? { documentUrl } : {}),
    };
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
    }));
    void persistUpdateSickLeave(id, updates);
  },
  removeShift: (shiftId) => {
    set((state) => {
      // Persist deletion to Supabase
      deleteShiftAssignmentFromSupabase(shiftId).catch((err: Error) =>
        console.error("? Failed to persist shift deletion:", err)
      );
      
      return {
        shiftAssignments: state.shiftAssignments.filter((shift) => shift.id !== shiftId),
      };
    });
  },
  deleteClockEvent: (recordId, eventId) => {
    const state = get();
    set((currentState) => {
      const updatedRecords = currentState.clockRecords
        .map((record) =>
          record.id === recordId
            ? { ...record, events: record.events.filter((event) => event.id !== eventId) }
            : record,
        )
        .filter((record) => record.events.length > 0);

      // Persist update to Supabase
      const updatedRecord = updatedRecords.find((r) => r.id === recordId);
      if (updatedRecord) {
        state.persistUpdateRecord(recordId, updatedRecord).catch((err: Error) =>
          console.error("? Failed to persist clock event deletion:", err)
        );
      } else {
        // Record no longer has events, delete it
        state.persistDeleteRecord(recordId).catch((err: Error) =>
          console.error("? Failed to persist clock record deletion:", err)
        );
      }

      return { clockRecords: updatedRecords };
    });
  },
  deleteClockRecord: (recordId) => {
    const state = get();
    set((currentState) => {
      // Persist deletion to Supabase
      state.persistDeleteRecord(recordId).catch((err: Error) =>
        console.error("? Failed to persist clock record deletion:", err)
      );

      return {
        clockRecords: currentState.clockRecords.filter((record) => record.id !== recordId),
      };
    });
  },
  deleteVacationRequest: (id) => {
    set((state) => {
      return {
        vacationRequests: state.vacationRequests.filter((request) => request.id !== id),
      };
    });
    void persistDeleteVacationRequest(id);
  },
  deleteSickLeave: (id) => {
    set((state) => {
      return {
        sickLeaves: state.sickLeaves.filter((entry) => entry.id !== id),
      };
    });
    void persistDeleteSickLeave(id);
  },
  addCalendarDay: ({ id, date, endDate, label, type, description, createdBy, createdAt, updatedAt }) => {
    const entry: CalendarDayEntry = {
      id: id?.trim() || `cal-${nanoid(6)}`,
      date,
      endDate: endDate ?? date,
      label: label.trim(),
      type,
      description: description?.trim() || undefined,
      createdBy: createdBy?.trim() || undefined,
      createdAt: createdAt ?? new Date().toISOString(),
      updatedAt,
    };
    set((state) => ({ calendarDays: [entry, ...state.calendarDays] }));
    void persistCreateCalendarDay(entry);
    return entry;
  },
  updateCalendarDay: (id, changes) => {
    const normalizedUpdates: Partial<CalendarDayEntry> = {
      ...changes,
      endDate: changes.endDate ?? undefined,
      label: changes.label?.trim(),
      description: changes.description?.trim(),
      createdBy: changes.createdBy?.trim(),
      updatedAt: changes.updatedAt ?? new Date().toISOString(),
    };
    set((state) => ({
      calendarDays: state.calendarDays.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...normalizedUpdates,
              endDate: normalizedUpdates.endDate ?? entry.endDate ?? entry.date,
              label: normalizedUpdates.label ?? entry.label,
              description: normalizedUpdates.description ?? entry.description,
              createdBy: normalizedUpdates.createdBy ?? entry.createdBy,
              updatedAt: normalizedUpdates.updatedAt ?? entry.updatedAt,
            }
          : entry,
      ),
    }));
    void persistUpdateCalendarDay(id, normalizedUpdates);
  },
  deleteCalendarDay: (id) => {
    set((state) => {
      return {
        calendarDays: state.calendarDays.filter((entry) => entry.id !== id),
      };
    });
    void persistDeleteCalendarDay(id);
  },
  };
});

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







