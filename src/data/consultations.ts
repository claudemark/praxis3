import type { InsuranceType } from "@/lib/insurance";

export type ConsultationStatus = "Abgeschlossen" | "Offen" | "Follow-up";
export type ConsultationSource = "Telefon" | "Website" | "Weiterempfehlung" | "Social Media" | "BG";

export interface ConsultationRecord {
  id: string;
  date: string;
  patient: string;
  patientId: string;
  insurance: InsuranceType;
  consultationType: string;
  source: ConsultationSource;
  status: ConsultationStatus;
  revenue: number;
  followUpNeeded: boolean;
  notes?: string;
}

export const consultations: ConsultationRecord[] = [
  {
    id: "CONS-2025-0924-01",
    date: "2025-09-24",
    patient: "Lena Wagner",
    patientId: "PAT-240924-01",
    insurance: "privat",
    consultationType: "Erstberatung Rücken",
    source: "Website",
    status: "Abgeschlossen",
    revenue: 180,
    followUpNeeded: true,
    notes: "PRP-Serie geplant",
  },
  {
    id: "CONS-2025-0924-02",
    date: "2025-09-24",
    patient: "Michael Sommer",
    patientId: "PAT-240924-02",
    insurance: "selbstzahler",
    consultationType: "IGeL Knie Check",
    source: "Telefon",
    status: "Offen",
    revenue: 0,
    followUpNeeded: false,
    notes: "Angebot offen",
  },
  {
    id: "CONS-2025-0924-03",
    date: "2025-09-24",
    patient: "Bastian Scholz",
    patientId: "PAT-240924-03",
    insurance: "bg",
    consultationType: "BG - Arbeitsunfall Hand",
    source: "BG",
    status: "Abgeschlossen",
    revenue: 260,
    followUpNeeded: true,
    notes: "Kontrolltermin in 7 Tagen",
  },
  {
    id: "CONS-2025-0923-01",
    date: "2025-09-23",
    patient: "Sabine Riedl",
    patientId: "PAT-240923-01",
    insurance: "privat",
    consultationType: "Zweitmeinung Hüfte",
    source: "Weiterempfehlung",
    status: "Follow-up",
    revenue: 210,
    followUpNeeded: true,
    notes: "Bildgebung anfordern",
  },
  {
    id: "CONS-2025-0923-02",
    date: "2025-09-23",
    patient: "Holger Stein",
    patientId: "PAT-240923-02",
    insurance: "selbstzahler",
    consultationType: "Stoßwelle Verlauf",
    source: "Website",
    status: "Abgeschlossen",
    revenue: 160,
    followUpNeeded: false,
  },
  {
    id: "CONS-2025-0922-01",
    date: "2025-09-22",
    patient: "Nina Köhler",
    patientId: "PAT-240922-01",
    insurance: "privat",
    consultationType: "Sport Check",
    source: "Social Media",
    status: "Abgeschlossen",
    revenue: 140,
    followUpNeeded: false,
    notes: "Sportprogramm erstellt",
  },
  {
    id: "CONS-2025-0921-01",
    date: "2025-09-21",
    patient: "Alexander Türk",
    patientId: "PAT-240921-01",
    insurance: "bg",
    consultationType: "BG - Knieverletzung",
    source: "BG",
    status: "Follow-up",
    revenue: 0,
    followUpNeeded: true,
    notes: "Gutachten anfordern",
  },
];
