import { create } from "zustand";

import {
  initialCashMovements,
  initialCashFloat,
  initialSnapshots,
  type CashMovement,
  type CashMovementType,
  type CashDrawerSnapshot,
} from "@/data/cash-drawer";
import {
  fetchCashMovementsFromSupabase,
  fetchCashSnapshotsFromSupabase,
  createCashMovementInSupabase,
  createCashSnapshotInSupabase,
} from "../api/cash-drawer-api";
import { isSupabaseConfigured } from "@/services/supabase-client";

interface RecordSalePayload {
  amount: number;
  description: string;
  referenceId?: string;
  employeeId?: string;
}

interface RecordExpensePayload {
  amount: number;
  description: string;
  employeeId: string;
  category?: string;
}

interface RecordFloatPayload {
  amount: number;
  description?: string;
  employeeId?: string;
}

interface RecordSnapshotPayload {
  countedAmount: number;
  note?: string;
  employeeId?: string;
}

interface CashDrawerState {
  movements: CashMovement[];
  snapshots: CashDrawerSnapshot[];
  currentBalance: number;
  lastReconcile?: CashDrawerSnapshot;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchCashDrawer: () => Promise<void>;
  registerSale: (payload: RecordSalePayload) => CashMovement;
  registerExpense: (payload: RecordExpensePayload) => CashMovement;
  registerFloat: (payload: RecordFloatPayload) => CashMovement;
  registerAdjustment: (amount: number, description: string, employeeId?: string) => CashMovement;
  recordSnapshot: (payload: RecordSnapshotPayload) => CashDrawerSnapshot;
  getBalanceAt: (index: number) => number;
}

interface MovementDraft {
  type: CashMovementType;
  amount: number;
  description: string;
  referenceId?: string;
  employeeId?: string;
  category?: string;
  timestamp?: string;
  id?: string;
}

function createMovement(
  state: CashDrawerState,
  movement: MovementDraft,
): CashMovement {
  const lastBalance = state.currentBalance;
  const amount = Number(movement.amount.toFixed(2));
  const balanceAfter = Number((lastBalance + amount).toFixed(2));
  const id = movement.id ?? `cash-${Date.now()}-${Math.round(Math.random() * 999)}`;
  return {
    id,
    timestamp: movement.timestamp ?? new Date().toISOString(),
    type: movement.type,
    amount,
    balanceAfter,
    description: movement.description,
    referenceId: movement.referenceId,
    employeeId: movement.employeeId,
    category: movement.category,
  };
}

function deriveInitialBalance(movements: CashMovement[]): number {
  if (!movements.length) {
    return initialCashFloat;
  }
  const sorted = [...movements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return sorted[0]!.balanceAfter;
}

export const useCashDrawerStore = create<CashDrawerState>((set, get) => {
  const persistMovement = async (movement: CashMovement) => {
    try {
      const saved = await createCashMovementInSupabase(movement);
      if (saved) {
        set((state) => ({
          movements: state.movements.map((m) => (m.id === movement.id ? saved : m)),
        }));
      }
    } catch (error) {
      console.error("[Cash Drawer Store] Failed to persist movement", error);
    }
  };

  const persistSnapshot = async (snapshot: CashDrawerSnapshot) => {
    try {
      const saved = await createCashSnapshotInSupabase(snapshot);
      if (saved) {
        set((state) => ({
          snapshots: state.snapshots.map((s) => (s.id === snapshot.id ? saved : s)),
        }));
      }
    } catch (error) {
      console.error("[Cash Drawer Store] Failed to persist snapshot", error);
    }
  };

  return {
  movements: initialCashMovements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  snapshots: initialSnapshots.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
  currentBalance: deriveInitialBalance(initialCashMovements),
  lastReconcile: initialSnapshots[0],
  isLoading: false,
  error: null,
  initialized: false,
  fetchCashDrawer: async () => {
    console.log("[Cash Drawer Store] fetchCashDrawer called, configured:", isSupabaseConfigured);
    if (!isSupabaseConfigured) {
      set({ initialized: true });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const [movements, snapshots] = await Promise.all([
        fetchCashMovementsFromSupabase(),
        fetchCashSnapshotsFromSupabase(),
      ]);
      console.log("[Cash Drawer Store] Loaded", movements.length, "movements and", snapshots.length, "snapshots from Supabase");
      const sortedMovements = movements.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const sortedSnapshots = snapshots.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      set({
        movements: sortedMovements,
        snapshots: sortedSnapshots,
        currentBalance: deriveInitialBalance(movements),
        lastReconcile: sortedSnapshots[0],
        isLoading: false,
        initialized: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[Cash Drawer Store] Failed to load cash drawer from Supabase", error);
      set({ isLoading: false, initialized: true, error: message });
    }
  },
  registerSale: ({ amount, description, referenceId, employeeId }) => {
    const state = get();
    const movement = createMovement(state, {
      type: "sale",
      amount: Math.abs(amount),
      description,
      referenceId,
      employeeId,
    });
    set({
      movements: [movement, ...state.movements],
      currentBalance: movement.balanceAfter,
    });
    void persistMovement(movement);
    return movement;
  },
  registerExpense: ({ amount, description, employeeId, category }) => {
    const state = get();
    const movement = createMovement(state, {
      type: "expense",
      amount: -Math.abs(amount),
      description,
      employeeId,
      category,
    });
    set({
      movements: [movement, ...state.movements],
      currentBalance: movement.balanceAfter,
    });
    void persistMovement(movement);
    return movement;
  },
  registerFloat: ({ amount, description, employeeId }) => {
    const state = get();
    const movement = createMovement(state, {
      type: "float-in",
      amount: Math.abs(amount),
      description: description ?? "Barkasse aufgefüllt",
      employeeId,
    });
    set({
      movements: [movement, ...state.movements],
      currentBalance: movement.balanceAfter,
    });
    void persistMovement(movement);
    return movement;
  },
  registerAdjustment: (amount, description, employeeId) => {
    const state = get();
    const movement = createMovement(state, {
      type: "adjustment",
      amount,
      description,
      employeeId,
    });
    set({
      movements: [movement, ...state.movements],
      currentBalance: movement.balanceAfter,
    });
    void persistMovement(movement);
    return movement;
  },
  recordSnapshot: ({ countedAmount, note, employeeId }) => {
    const state = get();
    const difference = Number((countedAmount - state.currentBalance).toFixed(2));
    const snapshot: CashDrawerSnapshot = {
      id: `snap-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      countedAmount,
      difference,
      note,
      employeeId,
    };
    set({
      snapshots: [snapshot, ...state.snapshots],
      lastReconcile: snapshot,
    });
    void persistSnapshot(snapshot);
    if (difference !== 0) {
      const adjustmentDescription = difference > 0 ? "Überbestand erfasst" : "Fehlbetrag erfasst";
      const movement = createMovement(get(), {
        type: "reconcile",
        amount: difference,
        description: adjustmentDescription,
        employeeId,
      });
      set((current) => ({
        movements: [movement, ...current.movements],
        currentBalance: movement.balanceAfter,
      }));
      void persistMovement(movement);
    }
    return snapshot;
  },
  getBalanceAt: (index: number) => {
    const state = get();
    if (index < 0 || index >= state.movements.length) {
      return state.currentBalance;
    }
    return state.movements[index]!.balanceAfter;
  },
  };
});

