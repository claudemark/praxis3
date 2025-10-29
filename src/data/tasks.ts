export interface SopChecklist {
  id: string;
  name: string;
  steps: string[];
  ownerId: string;
  lastAudit: string;
  compliance: number;
  category?: string;
  description?: string;
  updatedAt?: string;
}

export type GeneralTaskCadence = "daily" | "weekly" | "monthly" | "once";

export interface GeneralEmployeeTask {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  cadence: GeneralTaskCadence;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const sopChecklists: SopChecklist[] = [
  {
    id: "preop",
    name: "Prä-OP Knie TEP",
    steps: [
      "Laborwerte < 48h",
      "Anästhesie Aufklärung",
      "Implantatsatz steril",
      "Patientenaufklärung unterschrieben",
    ],
    ownerId: "emp-feld",
    lastAudit: "2025-09-18",
    compliance: 0.94,
    category: "OP Vorbereitung",
    description: "Standardablauf für Knie-TEP Eingriffe",
    updatedAt: "2025-09-20T08:15:00",
  },
  {
    id: "trauma",
    name: "Trauma-Algorithmus Polytrauma",
    steps: ["ABCDE-Assessment", "Analgesie", "CT-Schema", "OP Indikation"],
    ownerId: "emp-nguyen",
    lastAudit: "2025-09-20",
    compliance: 0.87,
    category: "Notaufnahme",
    description: "Algorithmus zur Versorgung von Polytrauma-Patient:innen",
    updatedAt: "2025-09-21T11:42:00",
  },
  {
    id: "postop",
    name: "Post-OP Sehnen-Dehnung",
    steps: ["Schmerzscore", "Drainagenkontrolle", "Mobilisationsplan"],
    ownerId: "emp-boettcher",
    lastAudit: "2025-09-22",
    compliance: 0.91,
    category: "Nachsorge",
    description: "Checkliste für standardisierte Nachsorge",
    updatedAt: "2025-09-22T15:03:00",
  },
];

export const generalEmployeeTasks: GeneralEmployeeTask[] = [
  {
    id: "gentask-1",
    employeeId: "emp-krause",
    title: "OP-Plan final prüfen",
    description: "OP-Slots mit Team abstimmen und Gerätefreigaben checken",
    cadence: "daily",
    active: true,
    createdAt: "2025-08-10T07:30:00",
    updatedAt: "2025-09-23T06:50:00",
  },
  {
    id: "gentask-2",
    employeeId: "emp-rehm",
    title: "Implantatbestände kontrollieren",
    description: "Reservierte Sets abgleichen und Nachbestellungen vorbereiten",
    cadence: "weekly",
    active: true,
    createdAt: "2025-07-02T12:12:00",
  },
  {
    id: "gentask-3",
    employeeId: "emp-mailer",
    title: "Privatabrechnung freigeben",
    description: "Offene Leistungen mit Praxisleitung abstimmen",
    cadence: "weekly",
    active: true,
    createdAt: "2025-08-18T09:00:00",
  },
  {
    id: "gentask-4",
    employeeId: "emp-boettcher",
    title: "Reha-Übungspläne aktualisieren",
    cadence: "monthly",
    active: false,
    createdAt: "2025-05-05T10:15:00",
    updatedAt: "2025-09-12T13:22:00",
  },
];
