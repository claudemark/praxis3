import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { OperationRecord } from "@/data/operations";

type OperationDbRecord = {
  id: string;
  date: string;
  patient: string;
  insurance: string;
  operation_type: string;
  room: string;
  surgeon: string;
  duration_minutes: number;
  revenue: number;
  costs: number;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const OPERATION_ENDPOINT = "/operations";

const toAppModel = (record: OperationDbRecord): OperationRecord => ({
  id: record.id,
  date: record.date,
  patient: record.patient,
  insurance: record.insurance as OperationRecord["insurance"],
  operationType: record.operation_type,
  room: record.room as OperationRecord["room"],
  surgeon: record.surgeon,
  durationMinutes: record.duration_minutes,
  revenue: record.revenue,
  costs: record.costs,
  status: record.status as OperationRecord["status"],
});

const toDbRecord = (operation: Partial<OperationRecord>): Partial<OperationDbRecord> => ({
  id: operation.id,
  date: operation.date,
  patient: operation.patient,
  insurance: operation.insurance,
  operation_type: operation.operationType,
  room: operation.room,
  surgeon: operation.surgeon,
  duration_minutes: operation.durationMinutes,
  revenue: operation.revenue,
  costs: operation.costs,
  status: operation.status,
});

export async function fetchOperationsFromSupabase(): Promise<OperationRecord[]> {
  console.log("[Operation API] Fetching operations, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<OperationDbRecord[]>(`${OPERATION_ENDPOINT}?select=*&order=date.desc`);
  console.log("[Operation API] Fetched", records.length, "operations from Supabase");
  return records.map(toAppModel);
}

export async function createOperationInSupabase(operation: OperationRecord): Promise<OperationRecord> {
  console.log("[Operation API] Creating operation:", operation.patient, "Configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return operation;
  }
  try {
    const payload = toDbRecord(operation);
    console.log("[Operation API] Sending payload:", payload);
    const [record] = await supabaseRequest<OperationDbRecord[]>(OPERATION_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Operation API] Created successfully:", record);
    return toAppModel(record);
  } catch (error) {
    console.error("[Operation API] Error creating:", error);
    throw error;
  }
}

export async function updateOperationInSupabase(
  id: string,
  changes: Partial<OperationRecord>,
): Promise<OperationRecord | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const payload = toDbRecord({ ...changes, id });
  delete payload.id;
  if (Object.keys(payload).length === 0) {
    return null;
  }
  const [record] = await supabaseRequest<OperationDbRecord[]>(
    `${OPERATION_ENDPOINT}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  return record ? toAppModel(record) : null;
}

export async function deleteOperationInSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabaseRequest(`${OPERATION_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    skipJsonParse: true,
  });
}
