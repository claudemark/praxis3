import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { IgelPriceListEntry, IgelTransaction } from "@/data/igel";

const SERVICES_ENDPOINT = "/igel_services";
const TRANSACTIONS_ENDPOINT = "/igel_transactions";

// Database record types
type IgelServiceDbRecord = {
  id: string;
  treatment: string;
  unit: string;
  price: number | string;
  cycle?: string | null;
  notes?: string | null;
  goa_codes?: string[] | null;
  materials?: any | null;
  receipt_template?: string[] | null;
  goa_breakdown?: any | null;
  created_at: string;
  updated_at?: string | null;
};

type IgelTransactionDbRecord = {
  id: string;
  patient: string;
  patient_number: string;
  service_id: string;
  collector: string;
  payment_method: string;
  quantity: number;
  amount: number | string;
  paid_amount: number | string;
  created_at: string;
  status?: string | null;
  notes?: string | null;
  include_notes_on_receipt?: boolean | null;
  receipt_lines?: string[] | null;
  goa_breakdown?: any | null;
};

// Mappers for IGeL Services (Price List)
const toServiceAppModel = (record: IgelServiceDbRecord): IgelPriceListEntry => ({
  id: record.id,
  treatment: record.treatment,
  unit: record.unit,
  price: typeof record.price === "string" ? parseFloat(record.price) : record.price,
  cycle: record.cycle || undefined,
  notes: record.notes || undefined,
  goaCodes: record.goa_codes || [],
  materials: record.materials || [],
  receiptTemplate: record.receipt_template || [],
  goaBreakdown: record.goa_breakdown || undefined,
});

const toServiceDbRecord = (entry: Partial<IgelPriceListEntry>): Partial<IgelServiceDbRecord> => ({
  id: entry.id,
  treatment: entry.treatment,
  unit: entry.unit,
  price: entry.price,
  cycle: entry.cycle || null,
  notes: entry.notes || null,
  goa_codes: entry.goaCodes || null,
  materials: entry.materials || null,
  receipt_template: entry.receiptTemplate || null,
  goa_breakdown: entry.goaBreakdown || null,
});

// Mappers for IGeL Transactions
const toTransactionAppModel = (record: IgelTransactionDbRecord): IgelTransaction => ({
  id: record.id,
  patient: record.patient,
  patientNumber: record.patient_number,
  serviceId: record.service_id,
  collector: record.collector,
  paymentMethod: record.payment_method as IgelTransaction["paymentMethod"],
  quantity: record.quantity,
  amount: typeof record.amount === "string" ? parseFloat(record.amount) : record.amount,
  paidAmount: typeof record.paid_amount === "string" ? parseFloat(record.paid_amount) : record.paid_amount,
  createdAt: record.created_at,
  status: (record.status as IgelTransaction["status"]) || "offen",
  notes: record.notes || undefined,
  includeNotesOnReceipt: record.include_notes_on_receipt || false,
  receiptLines: record.receipt_lines || undefined,
  goaBreakdown: record.goa_breakdown || undefined,
});

const toTransactionDbRecord = (transaction: Partial<IgelTransaction>): Partial<IgelTransactionDbRecord> => ({
  id: transaction.id,
  patient: transaction.patient,
  patient_number: transaction.patientNumber,
  service_id: transaction.serviceId,
  collector: transaction.collector,
  payment_method: transaction.paymentMethod,
  quantity: transaction.quantity,
  amount: transaction.amount,
  paid_amount: transaction.paidAmount,
  created_at: transaction.createdAt,
  status: transaction.status || null,
  notes: transaction.notes || null,
  include_notes_on_receipt: transaction.includeNotesOnReceipt || false,
  receipt_lines: transaction.receiptLines || null,
  goa_breakdown: transaction.goaBreakdown || null,
});

// IGeL Services (Price List) CRUD operations
export async function fetchIgelServicesFromSupabase(): Promise<IgelPriceListEntry[]> {
  console.log("[IGeL API] Fetching services, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<IgelServiceDbRecord[]>(`${SERVICES_ENDPOINT}?select=*&order=created_at.desc`);
  console.log("[IGeL API] Fetched", records.length, "services from Supabase");
  return records.map(toServiceAppModel);
}

export async function createIgelServiceInSupabase(entry: IgelPriceListEntry): Promise<IgelPriceListEntry> {
  console.log("[IGeL API] Creating service:", entry.treatment);
  console.log("[IGeL API] Full service object:", JSON.stringify(entry, null, 2));
  if (!isSupabaseConfigured) {
    console.log("[IGeL API] Supabase not configured, returning service as-is");
    return entry;
  }
  try {
    const dbRecord = toServiceDbRecord(entry);
    console.log("[IGeL API] Mapped service to DB record:", JSON.stringify(dbRecord, null, 2));
    const [record] = await supabaseRequest<IgelServiceDbRecord[]>(SERVICES_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(dbRecord),
    });
    console.log("[IGeL API] Service created successfully, response:", record);
    return toServiceAppModel(record);
  } catch (error) {
    console.error("[IGeL API] Error creating service:", error);
    console.error("[IGeL API] Error details:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateIgelServiceInSupabase(id: string, changes: Partial<IgelPriceListEntry>): Promise<IgelPriceListEntry | null> {
  console.log("[IGeL API] Updating service:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const [record] = await supabaseRequest<IgelServiceDbRecord[]>(`${SERVICES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toServiceDbRecord(changes)),
    });
    console.log("[IGeL API] Service updated successfully");
    return toServiceAppModel(record);
  } catch (error) {
    console.error("[IGeL API] Error updating service:", error);
    return null;
  }
}

export async function deleteIgelServiceFromSupabase(id: string): Promise<void> {
  console.log("[IGeL API] Deleting service:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabaseRequest(`${SERVICES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[IGeL API] Service deleted successfully");
  } catch (error) {
    console.error("[IGeL API] Error deleting service:", error);
    throw error;
  }
}

// IGeL Transactions CRUD operations
export async function fetchIgelTransactionsFromSupabase(): Promise<IgelTransaction[]> {
  console.log("[IGeL API] Fetching transactions, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<IgelTransactionDbRecord[]>(`${TRANSACTIONS_ENDPOINT}?select=*&order=created_at.desc`);
  console.log("[IGeL API] Fetched", records.length, "transactions from Supabase");
  return records.map(toTransactionAppModel);
}

export async function createIgelTransactionInSupabase(transaction: IgelTransaction): Promise<IgelTransaction> {
  console.log("[IGeL API] Creating transaction for patient:", transaction.patient);
  console.log("[IGeL API] Full transaction object:", JSON.stringify(transaction, null, 2));
  if (!isSupabaseConfigured) {
    console.log("[IGeL API] Supabase not configured, returning transaction as-is");
    return transaction;
  }
  try {
    const dbRecord = toTransactionDbRecord(transaction);
    console.log("[IGeL API] Mapped to DB record:", JSON.stringify(dbRecord, null, 2));
    const [record] = await supabaseRequest<IgelTransactionDbRecord[]>(TRANSACTIONS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(dbRecord),
    });
    console.log("[IGeL API] Transaction created successfully, response:", record);
    return toTransactionAppModel(record);
  } catch (error) {
    console.error("[IGeL API] Error creating transaction:", error);
    console.error("[IGeL API] Error details:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateIgelTransactionInSupabase(id: string, changes: Partial<IgelTransaction>): Promise<IgelTransaction | null> {
  console.log("[IGeL API] Updating transaction:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  try {
    const [record] = await supabaseRequest<IgelTransactionDbRecord[]>(`${TRANSACTIONS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toTransactionDbRecord(changes)),
    });
    console.log("[IGeL API] Transaction updated successfully");
    return toTransactionAppModel(record);
  } catch (error) {
    console.error("[IGeL API] Error updating transaction:", error);
    return null;
  }
}

export async function deleteIgelTransactionFromSupabase(id: string): Promise<void> {
  console.log("[IGeL API] Deleting transaction:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  try {
    await supabaseRequest(`${TRANSACTIONS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[IGeL API] Transaction deleted successfully");
  } catch (error) {
    console.error("[IGeL API] Error deleting transaction:", error);
    throw error;
  }
}
