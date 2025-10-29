import { create } from "zustand";
import {
  consultations as initialConsultations,
  type ConsultationRecord,
  type ConsultationStatus,
  type ConsultationSource,
} from "@/data/consultations";

interface ConsultationState {
  consultations: ConsultationRecord[];
  addConsultation: (entry: Omit<ConsultationRecord, "id">) => ConsultationRecord;
  updateConsultation: (id: string, changes: Partial<Omit<ConsultationRecord, "id">>) => void;
  deleteConsultation: (id: string) => void;
}

export const useConsultationStore = create<ConsultationState>((set) => ({
  consultations: initialConsultations,
  addConsultation: (entry) => {
    const record: ConsultationRecord = {
      ...entry,
      patient: entry.patient.trim(),
      patientId: entry.patientId.trim(),
      consultationType: entry.consultationType.trim(),
      notes: entry.notes,
      id: "CONS-" + Date.now(),
    };
    set((state) => ({ consultations: [record, ...state.consultations] }));
    return record;
  },
  updateConsultation: (id, changes) =>
    set((state) => ({
      consultations: state.consultations.map((record) =>
        record.id === id ? { ...record, ...changes } : record,
      ),
    })),
  deleteConsultation: (id) =>
    set((state) => ({ consultations: state.consultations.filter((record) => record.id !== id) })),
}));

export function computeConsultationMetrics(records: ConsultationRecord[]) {
  const totalRevenue = records.reduce((sum, item) => sum + item.revenue, 0);
  const countsByStatus = records.reduce<Record<ConsultationStatus, number>>(
    (acc, record) => ({ ...acc, [record.status]: (acc[record.status] ?? 0) + 1 }),
    { Abgeschlossen: 0, Offen: 0, "Follow-up": 0 },
  );
  const followUps = records.filter((record) => record.followUpNeeded).length;
  return { totalRevenue, countsByStatus, followUps };
}

export function groupConsultationsByPeriod(records: ConsultationRecord[], period: "day" | "week" | "month") {
  const now = new Date();
  return records.filter((record) => {
    const date = new Date(record.date);
    if (period === "day") return date.toDateString() === now.toDateString();
    if (period === "week") return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
}

export function groupBySource(records: ConsultationRecord[]) {
  const map = new Map<ConsultationSource, number>();
  records.forEach((record) => {
    map.set(record.source, (map.get(record.source) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([source, value]) => ({ source, value }));
}

export function groupRevenueTrend(records: ConsultationRecord[]) {
  const map = new Map<string, { revenue: number; count: number }>();
  records.forEach((record) => {
    const key = record.date.slice(0, 7);
    const entry = map.get(key) || { revenue: 0, count: 0 };
    entry.revenue += record.revenue;
    entry.count += 1;
    map.set(key, entry);
  });
  return Array.from(map.entries()).map(([month, value]) => ({ month, revenue: value.revenue, count: value.count }));
}
