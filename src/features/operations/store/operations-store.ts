import { create } from "zustand";
import {
  operations as initialOperations,
  type OperationRecord,
  type OperationRoom,
  type OperationStatus,
} from "@/data/operations";

interface OperationFilters {
  dateFrom?: string;
  dateTo?: string;
  room?: OperationRoom | "all";
  insurance?: "all" | OperationRecord["insurance"];
  surgeon?: string;
  status?: OperationStatus | "all";
}

interface OperationState {
  operations: OperationRecord[];
  filters: OperationFilters;
  setFilters: (filters: OperationFilters) => void;
  resetFilters: () => void;
  addOperation: (operation: Omit<OperationRecord, "id">) => OperationRecord;
  updateOperation: (id: string, changes: Partial<Omit<OperationRecord, "id">>) => void;
  deleteOperation: (id: string) => void;
}

const defaultFilters: OperationFilters = {
  room: "all",
  insurance: "all",
  status: "all",
};

export const useOperationStore = create<OperationState>((set) => ({
  operations: initialOperations,
  filters: defaultFilters,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
  addOperation: (operation) => {
    const record: OperationRecord = { ...operation, id: "OP-" + Date.now() };
    set((state) => ({ operations: [record, ...state.operations] }));
    return record;
  },
  updateOperation: (id, changes) =>
    set((state) => ({
      operations: state.operations.map((record) =>
        record.id === id ? { ...record, ...changes } : record,
      ),
    })),
  deleteOperation: (id) =>
    set((state) => ({ operations: state.operations.filter((record) => record.id !== id) })),
}));

export function filterOperations(records: OperationRecord[], filters: OperationFilters) {
  return records.filter((record) => {
    const date = new Date(record.date).getTime();
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      if (date < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime();
      if (date > to) return false;
    }
    if (filters.room && filters.room !== "all" && record.room !== filters.room) return false;
    if (filters.insurance && filters.insurance !== "all" && record.insurance !== filters.insurance) return false;
    if (filters.surgeon && filters.surgeon !== "") {
      if (!record.surgeon.toLowerCase().includes(filters.surgeon.toLowerCase())) return false;
    }
    if (filters.status && filters.status !== "all" && record.status !== filters.status) return false;
    return true;
  });
}

export function computeOperationMetrics(records: OperationRecord[]) {
  const totalRevenue = records.reduce((sum, op) => sum + op.revenue, 0);
  const totalCosts = records.reduce((sum, op) => sum + op.costs, 0);
  const profit = totalRevenue - totalCosts;
  const avgDuration = records.length
    ? Math.round(records.reduce((sum, op) => sum + op.durationMinutes, 0) / records.length)
    : 0;
  const count = records.length;
  return { totalRevenue, totalCosts, profit, avgDuration, count };
}

export function groupOperationsByMonth(records: OperationRecord[]) {
  const map = new Map<string, { count: number; revenue: number }>();
  records.forEach((record) => {
    const date = new Date(record.date);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const key = date.getFullYear() + "-" + month;
    const entry = map.get(key) || { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += record.revenue;
    map.set(key, entry);
  });
  return Array.from(map.entries()).map(([month, value]) => ({ month, count: value.count, revenue: value.revenue }));
}

export function groupRevenueByProcedure(records: OperationRecord[]) {
  const map = new Map<string, number>();
  records.forEach((record) => {
    map.set(record.operationType, (map.get(record.operationType) ?? 0) + record.revenue);
  });
  return Array.from(map.entries()).map(([operationType, revenue]) => ({ operationType, revenue }));
}
