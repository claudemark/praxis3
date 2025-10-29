import type { InsuranceType } from "@/lib/insurance";

export type OperationRoom = "ITN" | "IVR" | "Klein OP";
export type OperationStatus = "Geplant" | "Durchgeführt" | "Abgesagt";

export interface OperationRecord {
  id: string;
  date: string;
  patient: string;
  insurance: InsuranceType;
  operationType: string;
  room: OperationRoom;
  surgeon: string;
  durationMinutes: number;
  revenue: number;
  costs: number;
  status: OperationStatus;
}

export const operations: OperationRecord[] = [
  {
    id: "OP-2025-0924-01",
    date: "2025-09-24T08:30:00",
    patient: "Marc Lehmann",
    insurance: "privat",
    operationType: "Knie TEP",
    room: "ITN",
    surgeon: "Dr. Amelie Krause",
    durationMinutes: 120,
    revenue: 5400,
    costs: 2100,
    status: "Durchgeführt",
  },
  {
    id: "OP-2025-0924-02",
    date: "2025-09-24T13:15:00",
    patient: "Katja Meier",
    insurance: "gesetzlich",
    operationType: "HWS Infiltration",
    room: "IVR",
    surgeon: "Dr. Marten Vogt",
    durationMinutes: 45,
    revenue: 890,
    costs: 320,
    status: "Durchgeführt",
  },
  {
    id: "OP-2025-0925-01",
    date: "2025-09-25T10:00:00",
    patient: "Jonas Rehm",
    insurance: "gesetzlich",
    operationType: "Karpaltunnel Release",
    room: "Klein OP",
    surgeon: "Dr. Sofie Nguyen",
    durationMinutes: 35,
    revenue: 540,
    costs: 180,
    status: "Geplant",
  },
  {
    id: "OP-2025-0925-02",
    date: "2025-09-25T14:00:00",
    patient: "Frida Renz",
    insurance: "privat",
    operationType: "Hüft-Revision",
    room: "ITN",
    surgeon: "Dr. Amelie Krause",
    durationMinutes: 150,
    revenue: 6800,
    costs: 2750,
    status: "Geplant",
  },
  {
    id: "OP-2025-0926-01",
    date: "2025-09-26T09:30:00",
    patient: "Uwe Ritter",
    insurance: "gesetzlich",
    operationType: "Arthroskopie Schulter",
    room: "IVR",
    surgeon: "Dr. Marten Vogt",
    durationMinutes: 60,
    revenue: 1200,
    costs: 440,
    status: "Durchgeführt",
  },
  {
    id: "OP-2025-0926-02",
    date: "2025-09-26T12:00:00",
    patient: "Anja Lichten",
    insurance: "selbstzahler",
    operationType: "PRP Arthroskopie",
    room: "Klein OP",
    surgeon: "Dr. Sofie Nguyen",
    durationMinutes: 40,
    revenue: 750,
    costs: 220,
    status: "Durchgeführt",
  },
  {
    id: "OP-2025-0923-01",
    date: "2025-09-23T11:00:00",
    patient: "Mirko Hahn",
    insurance: "gesetzlich",
    operationType: "Meniskusrefixation",
    room: "ITN",
    surgeon: "Dr. Amelie Krause",
    durationMinutes: 95,
    revenue: 3200,
    costs: 1350,
    status: "Abgesagt",
  },
];
