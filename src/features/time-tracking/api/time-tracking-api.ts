import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { DailyClockRecord, ClockEvent } from "@/data/time-tracking";

// Supabase endpoints
const CLOCK_RECORDS_ENDPOINT = "/clock_records";
const TIME_ENTRIES_ENDPOINT = "/time_entries";

// ============= CLOCK RECORDS =============

type ClockRecordDbRecord = {
  id: string;
  employee_id: string;
  date: string;
  events: Array<{
    id: string;
    type: "clock-in" | "clock-out" | "break-start" | "break-end";
    timestamp: string;
    device: string;
    location: string;
  }>;
  created_at: string;
};

const toClockRecordAppModel = (db: ClockRecordDbRecord): DailyClockRecord => ({
  id: db.id,
  employeeId: db.employee_id,
  date: db.date,
  events: (db.events || []).map(e => ({
    id: e.id,
    type: e.type,
    timestamp: e.timestamp,
    device: e.device as "PC" | "Tablet" | "Smartphone",
    location: e.location,
  })),
});

const toClockRecordDbRecord = (record: Partial<DailyClockRecord>): Partial<ClockRecordDbRecord> => ({
  id: record.id,
  employee_id: record.employeeId,
  date: record.date,
  events: record.events?.map(e => ({
    id: e.id,
    type: e.type,
    timestamp: e.timestamp,
    device: e.device,
    location: e.location,
  })),
});

export async function fetchClockRecordsFromSupabase(): Promise<DailyClockRecord[]> {
  console.log("[Time Tracking API] Fetching clock records, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  try {
    const records = await supabaseRequest<ClockRecordDbRecord[]>(`${CLOCK_RECORDS_ENDPOINT}?select=*&order=date.desc`);
    console.log("[Time Tracking API] Fetched", records.length, "clock records from Supabase");
    return records.map(toClockRecordAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching clock records:", error);
    throw error;
  }
}

export async function createClockRecordInSupabase(record: DailyClockRecord): Promise<DailyClockRecord> {
  console.log("[Time Tracking API] Creating clock record:", record.id);
  if (!isSupabaseConfigured) {
    return record;
  }
  
  try {
    const [dbRecord] = await supabaseRequest<ClockRecordDbRecord[]>(CLOCK_RECORDS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toClockRecordDbRecord(record), created_at: new Date().toISOString() }),
    });
    console.log("[Time Tracking API] Clock record created successfully");
    return toClockRecordAppModel(dbRecord);
  } catch (error) {
    console.error("[Time Tracking API] Error creating clock record:", error);
    throw error;
  }
}

export async function updateClockRecordInSupabase(id: string, changes: Partial<DailyClockRecord>): Promise<DailyClockRecord | null> {
  console.log("[Time Tracking API] Updating clock record:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [dbRecord] = await supabaseRequest<ClockRecordDbRecord[]>(`${CLOCK_RECORDS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toClockRecordDbRecord(changes)),
    });
    console.log("[Time Tracking API] Clock record updated successfully");
    return toClockRecordAppModel(dbRecord);
  } catch (error) {
    console.error("[Time Tracking API] Error updating clock record:", error);
    return null;
  }
}

export async function deleteClockRecordFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting clock record:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${CLOCK_RECORDS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Clock record deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting clock record:", error);
    throw error;
  }
}

// ============= TIME ENTRIES (Simple Summary Table) =============

type TimeEntryDbRecord = {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const toTimeEntryAppModel = (db: TimeEntryDbRecord): TimeEntry => ({
  id: db.id,
  employeeId: db.employee_id,
  date: db.date,
  clockIn: db.clock_in,
  clockOut: db.clock_out,
  breakMinutes: db.break_minutes,
  notes: db.notes,
  status: db.status,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const toTimeEntryDbRecord = (entry: Partial<TimeEntry>): Partial<TimeEntryDbRecord> => ({
  id: entry.id,
  employee_id: entry.employeeId,
  date: entry.date,
  clock_in: entry.clockIn,
  clock_out: entry.clockOut,
  break_minutes: entry.breakMinutes,
  notes: entry.notes,
  status: entry.status,
  updated_at: new Date().toISOString(),
});

export async function fetchTimeEntriesFromSupabase(): Promise<TimeEntry[]> {
  console.log("[Time Tracking API] Fetching time entries, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  try {
    const records = await supabaseRequest<TimeEntryDbRecord[]>(`${TIME_ENTRIES_ENDPOINT}?select=*&order=date.desc`);
    console.log("[Time Tracking API] Fetched", records.length, "time entries from Supabase");
    return records.map(toTimeEntryAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching time entries:", error);
    throw error;
  }
}

export async function createTimeEntryInSupabase(entry: TimeEntry): Promise<TimeEntry> {
  console.log("[Time Tracking API] Creating time entry:", entry.id);
  if (!isSupabaseConfigured) {
    return entry;
  }
  
  try {
    const [dbRecord] = await supabaseRequest<TimeEntryDbRecord[]>(TIME_ENTRIES_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toTimeEntryDbRecord(entry), created_at: new Date().toISOString() }),
    });
    console.log("[Time Tracking API] Time entry created successfully");
    return toTimeEntryAppModel(dbRecord);
  } catch (error) {
    console.error("[Time Tracking API] Error creating time entry:", error);
    throw error;
  }
}

export async function updateTimeEntryInSupabase(id: string, changes: Partial<TimeEntry>): Promise<TimeEntry | null> {
  console.log("[Time Tracking API] Updating time entry:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [dbRecord] = await supabaseRequest<TimeEntryDbRecord[]>(`${TIME_ENTRIES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toTimeEntryDbRecord(changes)),
    });
    console.log("[Time Tracking API] Time entry updated successfully");
    return toTimeEntryAppModel(dbRecord);
  } catch (error) {
    console.error("[Time Tracking API] Error updating time entry:", error);
    return null;
  }
}

export async function deleteTimeEntryFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting time entry:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${TIME_ENTRIES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Time entry deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting time entry:", error);
    throw error;
  }
}

// ============= SHIFT ASSIGNMENTS =============

import type { ShiftAssignment } from "@/data/time-tracking";

const SHIFT_ASSIGNMENTS_ENDPOINT = "/shift_assignments";

type ShiftAssignmentDbRecord = {
  id: string;
  employee_id: string;
  role: string;
  start: string;
  end: string;
  station: string;
  status: string;
  notes: string | null;
  slot: string;
  created_at: string;
};

const toShiftAssignmentAppModel = (db: ShiftAssignmentDbRecord): ShiftAssignment => ({
  id: db.id,
  employeeId: db.employee_id,
  role: db.role,
  start: db.start,
  end: db.end,
  station: db.station,
  status: db.status as "geplant" | "bestätigt" | "offen",
  notes: db.notes || undefined,
  slot: db.slot as "morning" | "day" | "evening",
});

const toShiftAssignmentDbRecord = (shift: Partial<ShiftAssignment>): Partial<ShiftAssignmentDbRecord> => ({
  id: shift.id,
  employee_id: shift.employeeId,
  role: shift.role,
  start: shift.start,
  end: shift.end,
  station: shift.station,
  status: shift.status,
  notes: shift.notes || null,
  slot: shift.slot,
});

export async function fetchShiftAssignmentsFromSupabase(): Promise<ShiftAssignment[]> {
  console.log("[Time Tracking API] Fetching shift assignments...");
  if (!isSupabaseConfigured) {
    console.log("[Time Tracking API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<ShiftAssignmentDbRecord[]>(
      `${SHIFT_ASSIGNMENTS_ENDPOINT}?select=*&order=start.desc`
    );
    console.log("[Time Tracking API] Fetched shift assignments:", records.length);
    return records.map(toShiftAssignmentAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching shift assignments:", error);
    throw error;
  }
}

export async function createShiftAssignmentInSupabase(shift: ShiftAssignment): Promise<ShiftAssignment> {
  console.log("[Time Tracking API] Creating shift assignment:", shift);
  if (!isSupabaseConfigured) {
    return shift;
  }
  
  try {
    const payload = toShiftAssignmentDbRecord(shift);
    const [created] = await supabaseRequest<ShiftAssignmentDbRecord[]>(SHIFT_ASSIGNMENTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Shift assignment created:", created.id);
    return toShiftAssignmentAppModel(created);
  } catch (error) {
    console.error("[Time Tracking API] Error creating shift assignment:", error);
    throw error;
  }
}

export async function updateShiftAssignmentInSupabase(id: string, shift: Partial<ShiftAssignment>): Promise<void> {
  console.log("[Time Tracking API] Updating shift assignment:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toShiftAssignmentDbRecord(shift);
    await supabaseRequest(`${SHIFT_ASSIGNMENTS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Shift assignment updated successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error updating shift assignment:", error);
    throw error;
  }
}

export async function deleteShiftAssignmentFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting shift assignment:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${SHIFT_ASSIGNMENTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Shift assignment deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting shift assignment:", error);
    throw error;
  }
}

// ============= VACATION REQUESTS =============

import type { VacationRequest } from "@/data/time-tracking";

const VACATION_REQUESTS_ENDPOINT = "/vacation_requests";

type VacationRequestDbRecord = {
  id: string;
  employee_id: string;
  from_date: string;
  to_date: string;
  status: string;
  comment: string | null;
  created_at: string;
  updated_at: string | null;
};

const toVacationRequestAppModel = (db: VacationRequestDbRecord): VacationRequest => ({
  id: db.id,
  employeeId: db.employee_id,
  from: db.from_date,
  to: db.to_date,
  status: db.status as "Neu" | "In Prüfung" | "Genehmigt" | "Abgelehnt",
  comment: db.comment || undefined,
});

const toVacationRequestDbRecord = (req: Partial<VacationRequest>): Partial<VacationRequestDbRecord> => ({
  id: req.id,
  employee_id: req.employeeId,
  from_date: req.from,
  to_date: req.to,
  status: req.status,
  comment: req.comment || null,
});

export async function fetchVacationRequestsFromSupabase(): Promise<VacationRequest[]> {
  console.log("[Time Tracking API] Fetching vacation requests...");
  if (!isSupabaseConfigured) {
    console.log("[Time Tracking API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<VacationRequestDbRecord[]>(
      `${VACATION_REQUESTS_ENDPOINT}?select=*&order=created_at.desc`
    );
    console.log("[Time Tracking API] Fetched vacation requests:", records.length);
    return records.map(toVacationRequestAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching vacation requests:", error);
    throw error;
  }
}

export async function createVacationRequestInSupabase(req: VacationRequest): Promise<VacationRequest> {
  console.log("[Time Tracking API] Creating vacation request:", req);
  if (!isSupabaseConfigured) {
    return req;
  }
  
  try {
    const payload = toVacationRequestDbRecord(req);
    const [created] = await supabaseRequest<VacationRequestDbRecord[]>(VACATION_REQUESTS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Vacation request created:", created.id);
    return toVacationRequestAppModel(created);
  } catch (error) {
    console.error("[Time Tracking API] Error creating vacation request:", error);
    throw error;
  }
}

export async function updateVacationRequestInSupabase(id: string, req: Partial<VacationRequest>): Promise<void> {
  console.log("[Time Tracking API] Updating vacation request:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toVacationRequestDbRecord(req);
    await supabaseRequest(`${VACATION_REQUESTS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Vacation request updated successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error updating vacation request:", error);
    throw error;
  }
}

export async function deleteVacationRequestFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting vacation request:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${VACATION_REQUESTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Vacation request deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting vacation request:", error);
    throw error;
  }
}

// ============= SICK LEAVES =============

import type { SickLeave } from "@/data/time-tracking";

const SICK_LEAVES_ENDPOINT = "/sick_leaves";

type SickLeaveDbRecord = {
  id: string;
  employee_id: string;
  from_date: string;
  to_date: string;
  document_url: string | null;
  status: string;
  created_at: string;
};

const toSickLeaveAppModel = (db: SickLeaveDbRecord): SickLeave => ({
  id: db.id,
  employeeId: db.employee_id,
  from: db.from_date,
  to: db.to_date,
  documentUrl: db.document_url || undefined,
  status: db.status as "Gemeldet" | "Dokument offen" | "Bestätigt",
});

const toSickLeaveDbRecord = (leave: Partial<SickLeave>): Partial<SickLeaveDbRecord> => ({
  id: leave.id,
  employee_id: leave.employeeId,
  from_date: leave.from,
  to_date: leave.to,
  document_url: leave.documentUrl || null,
  status: leave.status,
});

export async function fetchSickLeavesFromSupabase(): Promise<SickLeave[]> {
  console.log("[Time Tracking API] Fetching sick leaves...");
  if (!isSupabaseConfigured) {
    console.log("[Time Tracking API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<SickLeaveDbRecord[]>(
      `${SICK_LEAVES_ENDPOINT}?select=*&order=created_at.desc`
    );
    console.log("[Time Tracking API] Fetched sick leaves:", records.length);
    return records.map(toSickLeaveAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching sick leaves:", error);
    throw error;
  }
}

export async function createSickLeaveInSupabase(leave: SickLeave): Promise<SickLeave> {
  console.log("[Time Tracking API] Creating sick leave:", leave);
  if (!isSupabaseConfigured) {
    return leave;
  }
  
  try {
    const payload = toSickLeaveDbRecord(leave);
    const [created] = await supabaseRequest<SickLeaveDbRecord[]>(SICK_LEAVES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Sick leave created:", created.id);
    return toSickLeaveAppModel(created);
  } catch (error) {
    console.error("[Time Tracking API] Error creating sick leave:", error);
    throw error;
  }
}

export async function updateSickLeaveInSupabase(id: string, leave: Partial<SickLeave>): Promise<void> {
  console.log("[Time Tracking API] Updating sick leave:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toSickLeaveDbRecord(leave);
    await supabaseRequest(`${SICK_LEAVES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Sick leave updated successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error updating sick leave:", error);
    throw error;
  }
}

export async function deleteSickLeaveFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting sick leave:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${SICK_LEAVES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Sick leave deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting sick leave:", error);
    throw error;
  }
}

// ============= CALENDAR DAYS =============

import type { CalendarDayEntry } from "@/data/time-tracking";

const CALENDAR_DAYS_ENDPOINT = "/calendar_days";

type CalendarDayDbRecord = {
  id: string;
  date: string;
  label: string;
  type: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
};

const toCalendarDayAppModel = (db: CalendarDayDbRecord): CalendarDayEntry => ({
  id: db.id,
  date: db.date,
  label: db.label,
  type: db.type as "public-holiday" | "company-holiday" | "vacation" | "bonus-holiday",
  description: db.description || undefined,
  createdBy: db.created_by,
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

const toCalendarDayDbRecord = (day: Partial<CalendarDayEntry>): Partial<CalendarDayDbRecord> => ({
  id: day.id,
  date: day.date,
  label: day.label,
  type: day.type,
  description: day.description || null,
  created_by: day.createdBy,
  created_at: day.createdAt,
  updated_at: day.updatedAt || null,
});

export async function fetchCalendarDaysFromSupabase(): Promise<CalendarDayEntry[]> {
  console.log("[Time Tracking API] Fetching calendar days...");
  if (!isSupabaseConfigured) {
    console.log("[Time Tracking API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<CalendarDayDbRecord[]>(
      `${CALENDAR_DAYS_ENDPOINT}?select=*&order=date.asc`
    );
    console.log("[Time Tracking API] Fetched calendar days:", records.length);
    return records.map(toCalendarDayAppModel);
  } catch (error) {
    console.error("[Time Tracking API] Error fetching calendar days:", error);
    throw error;
  }
}

export async function createCalendarDayInSupabase(day: CalendarDayEntry): Promise<CalendarDayEntry> {
  console.log("[Time Tracking API] Creating calendar day:", day);
  if (!isSupabaseConfigured) {
    return day;
  }
  
  try {
    const payload = toCalendarDayDbRecord(day);
    const [created] = await supabaseRequest<CalendarDayDbRecord[]>(CALENDAR_DAYS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Calendar day created:", created.id);
    return toCalendarDayAppModel(created);
  } catch (error) {
    console.error("[Time Tracking API] Error creating calendar day:", error);
    throw error;
  }
}

export async function updateCalendarDayInSupabase(id: string, day: Partial<CalendarDayEntry>): Promise<void> {
  console.log("[Time Tracking API] Updating calendar day:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toCalendarDayDbRecord(day);
    await supabaseRequest(`${CALENDAR_DAYS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Time Tracking API] Calendar day updated successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error updating calendar day:", error);
    throw error;
  }
}

export async function deleteCalendarDayFromSupabase(id: string): Promise<void> {
  console.log("[Time Tracking API] Deleting calendar day:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${CALENDAR_DAYS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Time Tracking API] Calendar day deleted successfully");
  } catch (error) {
    console.error("[Time Tracking API] Error deleting calendar day:", error);
    throw error;
  }
}
