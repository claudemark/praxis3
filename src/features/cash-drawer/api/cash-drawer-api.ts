import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { CashMovement, CashDrawerSnapshot } from "@/data/cash-drawer";

const MOVEMENTS_ENDPOINT = "/cash_movements";
const SNAPSHOTS_ENDPOINT = "/cash_snapshots";

// Database record types
type CashMovementDbRecord = {
  id: string;
  timestamp: string;
  type: string;
  amount: number | string;
  description?: string | null;
  reference_id?: string | null;
  employee_id?: string | null;
  category?: string | null;
  balance_after?: number | string | null;
};

type CashSnapshotDbRecord = {
  id: string;
  timestamp: string;
  counted: number | string;
  expected: number | string;
  difference: number | string;
  note?: string | null;
};

// Mappers for Cash Movements
const toMovementAppModel = (record: CashMovementDbRecord): CashMovement => ({
  id: record.id,
  timestamp: record.timestamp,
  type: record.type as CashMovement["type"],
  amount: typeof record.amount === "string" ? parseFloat(record.amount) : record.amount,
  description: record.description || "",
  referenceId: record.reference_id || undefined,
  employeeId: record.employee_id || undefined,
  category: record.category || undefined,
  balanceAfter: record.balance_after 
    ? (typeof record.balance_after === "string" ? parseFloat(record.balance_after) : record.balance_after)
    : 0,
});

const toMovementDbRecord = (movement: Partial<CashMovement>): Partial<CashMovementDbRecord> => ({
  id: movement.id,
  timestamp: movement.timestamp,
  type: movement.type,
  amount: movement.amount,
  description: movement.description || null,
  reference_id: movement.referenceId || null,
  employee_id: movement.employeeId || null,
  category: movement.category || null,
  balance_after: movement.balanceAfter,
});

// Mappers for Cash Snapshots
const toSnapshotAppModel = (record: CashSnapshotDbRecord): CashDrawerSnapshot => ({
  id: record.id,
  recordedAt: record.timestamp,
  countedAmount: typeof record.counted === "string" ? parseFloat(record.counted) : record.counted,
  difference: typeof record.difference === "string" ? parseFloat(record.difference) : record.difference,
  note: record.note || undefined,
});

const toSnapshotDbRecord = (snapshot: Partial<CashDrawerSnapshot>): Partial<CashSnapshotDbRecord> => {
  const counted = snapshot.countedAmount || 0;
  const expected = counted - (snapshot.difference || 0);
  return {
    id: snapshot.id,
    timestamp: snapshot.recordedAt,
    counted,
    expected,
    difference: snapshot.difference || 0,
    note: snapshot.note || null,
  };
};

// Cash Movement CRUD operations
export async function fetchCashMovementsFromSupabase(): Promise<CashMovement[]> {
  console.log("[Cash Drawer API] Fetching movements, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<CashMovementDbRecord[]>(`${MOVEMENTS_ENDPOINT}?select=*&order=timestamp.desc`);
  console.log("[Cash Drawer API] Fetched", records.length, "movements from Supabase");
  return records.map(toMovementAppModel);
}

export async function createCashMovementInSupabase(movement: CashMovement): Promise<CashMovement> {
  console.log("[Cash Drawer API] Creating movement:", movement.description);
  if (!isSupabaseConfigured) {
    return movement;
  }
  try {
    const [record] = await supabaseRequest<CashMovementDbRecord[]>(MOVEMENTS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toMovementDbRecord(movement)),
    });
    console.log("[Cash Drawer API] Movement created successfully");
    return toMovementAppModel(record);
  } catch (error) {
    console.error("[Cash Drawer API] Error creating movement:", error);
    throw error;
  }
}

export async function updateCashMovementInSupabase(id: string, changes: Partial<CashMovement>): Promise<CashMovement | null> {
  console.log("[Cash Drawer API] Updating movement:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const [record] = await supabaseRequest<CashMovementDbRecord[]>(`${MOVEMENTS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toMovementDbRecord(changes)),
    });
    console.log("[Cash Drawer API] Movement updated successfully");
    return toMovementAppModel(record);
  } catch (error) {
    console.error("[Cash Drawer API] Error updating movement:", error);
    return null;
  }
}

export async function deleteCashMovementFromSupabase(id: string): Promise<void> {
  console.log("[Cash Drawer API] Deleting movement:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabaseRequest(`${MOVEMENTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Cash Drawer API] Movement deleted successfully");
  } catch (error) {
    console.error("[Cash Drawer API] Error deleting movement:", error);
    throw error;
  }
}

// Cash Snapshot CRUD operations
export async function fetchCashSnapshotsFromSupabase(): Promise<CashDrawerSnapshot[]> {
  console.log("[Cash Drawer API] Fetching snapshots, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<CashSnapshotDbRecord[]>(`${SNAPSHOTS_ENDPOINT}?select=*&order=timestamp.desc`);
  console.log("[Cash Drawer API] Fetched", records.length, "snapshots from Supabase");
  return records.map(toSnapshotAppModel);
}

export async function createCashSnapshotInSupabase(snapshot: CashDrawerSnapshot): Promise<CashDrawerSnapshot> {
  console.log("[Cash Drawer API] Creating snapshot at:", snapshot.recordedAt);
  if (!isSupabaseConfigured) {
    return snapshot;
  }
  try {
    const [record] = await supabaseRequest<CashSnapshotDbRecord[]>(SNAPSHOTS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toSnapshotDbRecord(snapshot)),
    });
    console.log("[Cash Drawer API] Snapshot created successfully");
    return toSnapshotAppModel(record);
  } catch (error) {
    console.error("[Cash Drawer API] Error creating snapshot:", error);
    throw error;
  }
}

export async function deleteCashSnapshotFromSupabase(id: string): Promise<void> {
  console.log("[Cash Drawer API] Deleting snapshot:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabaseRequest(`${SNAPSHOTS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Cash Drawer API] Snapshot deleted successfully");
  } catch (error) {
    console.error("[Cash Drawer API] Error deleting snapshot:", error);
    throw error;
  }
}
