export type DeviceType = "PC" | "Tablet" | "Smartphone";

export interface ClockEvent {
  id: string;
  type: "clock-in" | "clock-out" | "break-start" | "break-end";
  timestamp: string;
  device: DeviceType;
  location: string;
}

export interface DailyClockRecord {
  id: string;
  employeeId: string;
  date: string;
  events: ClockEvent[];
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  role: string;
  start: string;
  end: string;
  station: string;
  status: "geplant" | "bestätigt" | "offen";
  notes?: string;
  slot: "morning" | "day" | "evening";
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  from: string;
  to: string;
  status: "Genehmigt" | "In Prüfung" | "Abgelehnt" | "Neu";
  comment?: string;
}

export interface SickLeave {
  id: string;
  employeeId: string;
  from: string;
  to: string;
  documentUrl?: string;
  status: "Gemeldet" | "Dokument offen" | "Bestätigt";
}

export type CalendarDayType = "public-holiday" | "company-holiday" | "bonus-holiday" | "vacation";

export interface CalendarDayEntry {
  id: string;
  date: string;
  label: string;
  type: CalendarDayType;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export const initialClockRecords: DailyClockRecord[] = [
  {
    id: "clock-krause-2025-09-24",
    employeeId: "emp-krause",
    date: "2025-09-24",
    events: [
      { id: "evt-1", type: "clock-in", timestamp: "2025-09-24T07:52:00", device: "PC", location: "Empfang" },
      { id: "evt-2", type: "break-start", timestamp: "2025-09-24T12:25:00", device: "Tablet", location: "Lounge" },
      { id: "evt-3", type: "break-end", timestamp: "2025-09-24T12:53:00", device: "Tablet", location: "Lounge" },
      { id: "evt-4", type: "clock-out", timestamp: "2025-09-24T18:04:00", device: "Smartphone", location: "OP 2" },
    ],
  },
  {
    id: "clock-boettcher-2025-09-24",
    employeeId: "emp-boettcher",
    date: "2025-09-24",
    events: [
      { id: "evt-5", type: "clock-in", timestamp: "2025-09-24T08:58:00", device: "Tablet", location: "Therapie" },
      { id: "evt-6", type: "break-start", timestamp: "2025-09-24T13:02:00", device: "Tablet", location: "Cafeteria" },
      { id: "evt-7", type: "break-end", timestamp: "2025-09-24T13:33:00", device: "Tablet", location: "Cafeteria" },
      { id: "evt-8", type: "clock-out", timestamp: "2025-09-24T16:08:00", device: "PC", location: "Therapie" },
    ],
  },
  {
    id: "clock-rehm-2025-09-24",
    employeeId: "emp-rehm",
    date: "2025-09-24",
    events: [
      { id: "evt-9", type: "clock-in", timestamp: "2025-09-24T06:55:00", device: "Smartphone", location: "OP 2" },
      { id: "evt-10", type: "break-start", timestamp: "2025-09-24T11:30:00", device: "Tablet", location: "Kantine" },
      { id: "evt-11", type: "break-end", timestamp: "2025-09-24T12:00:00", device: "Tablet", location: "Kantine" },
      { id: "evt-12", type: "clock-out", timestamp: "2025-09-24T15:36:00", device: "PC", location: "Lager" },
    ],
  },
];

export const initialShiftAssignments: ShiftAssignment[] = [
  {
    id: "shift-1",
    employeeId: "emp-krause",
    role: "Orthopädin",
    start: "2025-09-24T08:00:00",
    end: "2025-09-24T14:00:00",
    station: "OP 2",
    status: "bestätigt",
    notes: "Knie TEP, Hüfte Arthroskopie",
    slot: "morning",
  },
  {
    id: "shift-2",
    employeeId: "emp-vogt",
    role: "Unfallchirurg",
    start: "2025-09-24T10:00:00",
    end: "2025-09-24T18:00:00",
    station: "OP 1",
    status: "geplant",
    slot: "day",
  },
  {
    id: "shift-3",
    employeeId: "emp-boettcher",
    role: "Physiotherapie",
    start: "2025-09-24T09:00:00",
    end: "2025-09-24T16:00:00",
    station: "Therapie",
    status: "bestätigt",
    notes: "Post-OP Mobilisation",
    slot: "day",
  },
  {
    id: "shift-4",
    employeeId: "emp-rehm",
    role: "OP Pflege",
    start: "2025-09-24T07:00:00",
    end: "2025-09-24T15:30:00",
    station: "OP 2",
    status: "bestätigt",
    slot: "morning",
  },
  {
    id: "shift-5",
    employeeId: "emp-werner",
    role: "Finanzcontrolling",
    start: "2025-09-24T08:30:00",
    end: "2025-09-24T17:00:00",
    station: "Backoffice",
    status: "geplant",
    notes: "Quartalsabschluss",
    slot: "day",
  },
];

export const initialVacationRequests: VacationRequest[] = [
  { id: "vac-1", employeeId: "emp-mailer", from: "2025-10-02", to: "2025-10-09", status: "Genehmigt" },
  { id: "vac-2", employeeId: "emp-kranz", from: "2025-09-23", to: "2025-09-26", status: "In Prüfung" },
  { id: "vac-3", employeeId: "emp-feld", from: "2025-10-16", to: "2025-10-19", status: "Neu" },
];

export const initialSickLeaves: SickLeave[] = [
  {
    id: "sick-1",
    employeeId: "emp-kranz",
    from: "2025-09-23",
    to: "2025-09-26",
    status: "Dokument offen",
  },
];

export const initialCalendarDays: CalendarDayEntry[] = [
  {
    id: "cal-2025-neujahr",
    date: "2025-01-01",
    label: "Neujahr",
    type: "public-holiday",
    description: "Bundesweiter Feiertag",
    createdBy: "System",
    createdAt: "2024-12-01T09:00:00",
  },
  {
    id: "cal-2025-ostermontag",
    date: "2025-04-21",
    label: "Ostermontag",
    type: "public-holiday",
    description: "Bundesweiter Feiertag",
    createdBy: "System",
    createdAt: "2024-12-01T09:00:00",
  },
  {
    id: "cal-2025-brückentag",
    date: "2025-05-30",
    label: "Brückentag geschenkt",
    type: "bonus-holiday",
    description: "Freier Tag durch Praxisleitung",
    createdBy: "Marcus Linde",
    createdAt: "2025-03-01T09:30:00",
  },
  {
    id: "cal-2025-sommerurlaub",
    date: "2025-08-02",
    label: "Praxisurlaub",
    type: "company-holiday",
    description: "Sommerpause komplett geschlossen",
    createdBy: "Dr. Amelie Krause",
    createdAt: "2025-06-12T12:15:00",
  },
  {
    id: "cal-2025-krause-urlaub",
    date: "2025-09-02",
    label: "Urlaub Dr. Krause",
    type: "vacation",
    description: "Individuelle Urlaubsplanung",
    createdBy: "emp-krause",
    createdAt: "2025-03-22T08:00:00",
  },
  {
    id: "cal-2025-chef-tag",
    date: "2025-11-29",
    label: "Chef schenkt Advent",
    type: "bonus-holiday",
    description: "Zusätzlicher freier Tag",
    createdBy: "Marcus Linde",
    createdAt: "2025-09-01T10:00:00",
  },
];






