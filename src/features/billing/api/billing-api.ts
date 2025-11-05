import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { GoACode, CodeBundle } from "@/data/billing";

// Supabase endpoints
const GOA_CODES_ENDPOINT = "/goa_codes";
const CODE_BUNDLES_ENDPOINT = "/code_bundles";

// ============= GOÄ CODES =============

type GoACodeDbRecord = {
  nummer: string;
  bezeichnung: string;
  punktzahl: number;
  euro: string;
  region: string;
  kategorie: string;
  beschreibung: string;
  kompatibel_mit: string[] | null;
  haeufigkeit: string;
  abrechnung: string;
  favorite: boolean;
  created_at: string;
};

const toGoACodeAppModel = (db: GoACodeDbRecord): GoACode => ({
  nummer: db.nummer,
  bezeichnung: db.bezeichnung,
  punktzahl: db.punktzahl,
  euro: typeof db.euro === "string" ? parseFloat(db.euro) : db.euro,
  region: db.region,
  kategorie: db.kategorie,
  beschreibung: db.beschreibung,
  kompatibelMit: db.kompatibel_mit || [],
  haeufigkeit: db.haeufigkeit,
  abrechnung: db.abrechnung as "privat" | "bg" | "kv",
  favorite: db.favorite,
});

const toGoACodeDbRecord = (code: Partial<GoACode>): Partial<GoACodeDbRecord> => ({
  nummer: code.nummer,
  bezeichnung: code.bezeichnung,
  punktzahl: code.punktzahl,
  euro: code.euro?.toString(),
  region: code.region,
  kategorie: code.kategorie,
  beschreibung: code.beschreibung,
  kompatibel_mit: code.kompatibelMit || null,
  haeufigkeit: code.haeufigkeit,
  abrechnung: code.abrechnung,
  favorite: code.favorite ?? false,
});

export async function fetchGoACodesFromSupabase(): Promise<GoACode[]> {
  console.log("[Billing API] Fetching GOÄ codes, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  const records = await supabaseRequest<GoACodeDbRecord[]>(`${GOA_CODES_ENDPOINT}?select=*&order=created_at.desc`);
  console.log("[Billing API] Fetched", records.length, "GOÄ codes from Supabase");
  return records.map(toGoACodeAppModel);
}

export async function createGoACodeInSupabase(code: GoACode): Promise<GoACode> {
  console.log("[Billing API] Creating GOÄ code:", code.nummer);
  if (!isSupabaseConfigured) {
    return code;
  }
  
  try {
    const [record] = await supabaseRequest<GoACodeDbRecord[]>(GOA_CODES_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toGoACodeDbRecord(code), created_at: new Date().toISOString() }),
    });
    console.log("[Billing API] GOÄ code created successfully");
    return toGoACodeAppModel(record);
  } catch (error) {
    console.error("[Billing API] Error creating GOÄ code:", error);
    throw error;
  }
}

export async function updateGoACodeInSupabase(nummer: string, changes: Partial<GoACode>): Promise<GoACode | null> {
  console.log("[Billing API] Updating GOÄ code:", nummer);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [record] = await supabaseRequest<GoACodeDbRecord[]>(`${GOA_CODES_ENDPOINT}?nummer=eq.${nummer}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toGoACodeDbRecord(changes)),
    });
    console.log("[Billing API] GOÄ code updated successfully");
    return toGoACodeAppModel(record);
  } catch (error) {
    console.error("[Billing API] Error updating GOÄ code:", error);
    return null;
  }
}

export async function deleteGoACodeFromSupabase(nummer: string): Promise<void> {
  console.log("[Billing API] Deleting GOÄ code:", nummer);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${GOA_CODES_ENDPOINT}?nummer=eq.${nummer}`, {
      method: "DELETE",
    });
    console.log("[Billing API] GOÄ code deleted successfully");
  } catch (error) {
    console.error("[Billing API] Error deleting GOÄ code:", error);
    throw error;
  }
}

// ============= CODE BUNDLES =============

type CodeBundleDbRecord = {
  id: string;
  title: string;
  beschreibung: string;
  codes: string[];
  channel: string;
  favorite: boolean;
  created_at: string;
};

const toCodeBundleAppModel = (db: CodeBundleDbRecord): CodeBundle => ({
  id: db.id,
  title: db.title,
  beschreibung: db.beschreibung,
  codes: db.codes,
  channel: db.channel as "privat" | "bg" | "kv",
  favorite: db.favorite,
});

const toCodeBundleDbRecord = (bundle: Partial<CodeBundle>): Partial<CodeBundleDbRecord> => ({
  id: bundle.id,
  title: bundle.title,
  beschreibung: bundle.beschreibung,
  codes: bundle.codes,
  channel: bundle.channel,
  favorite: bundle.favorite ?? false,
});

export async function fetchCodeBundlesFromSupabase(): Promise<CodeBundle[]> {
  console.log("[Billing API] Fetching code bundles, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  const records = await supabaseRequest<CodeBundleDbRecord[]>(`${CODE_BUNDLES_ENDPOINT}?select=*&order=created_at.desc`);
  console.log("[Billing API] Fetched", records.length, "code bundles from Supabase");
  return records.map(toCodeBundleAppModel);
}

export async function createCodeBundleInSupabase(bundle: CodeBundle): Promise<CodeBundle> {
  console.log("[Billing API] Creating code bundle:", bundle.id);
  if (!isSupabaseConfigured) {
    return bundle;
  }
  
  try {
    const [record] = await supabaseRequest<CodeBundleDbRecord[]>(CODE_BUNDLES_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toCodeBundleDbRecord(bundle), created_at: new Date().toISOString() }),
    });
    console.log("[Billing API] Code bundle created successfully");
    return toCodeBundleAppModel(record);
  } catch (error) {
    console.error("[Billing API] Error creating code bundle:", error);
    throw error;
  }
}

export async function updateCodeBundleInSupabase(id: string, changes: Partial<CodeBundle>): Promise<CodeBundle | null> {
  console.log("[Billing API] Updating code bundle:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [record] = await supabaseRequest<CodeBundleDbRecord[]>(`${CODE_BUNDLES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toCodeBundleDbRecord(changes)),
    });
    console.log("[Billing API] Code bundle updated successfully");
    return toCodeBundleAppModel(record);
  } catch (error) {
    console.error("[Billing API] Error updating code bundle:", error);
    return null;
  }
}

export async function deleteCodeBundleFromSupabase(id: string): Promise<void> {
  console.log("[Billing API] Deleting code bundle:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${CODE_BUNDLES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Billing API] Code bundle deleted successfully");
  } catch (error) {
    console.error("[Billing API] Error deleting code bundle:", error);
    throw error;
  }
}

// ============= BILLING INVOICES =============

import type { Invoice, InvoiceItem } from "@/data/billing";

const BILLING_INVOICES_ENDPOINT = "/billing_invoices";

type InvoiceDbRecord = {
  id: string;
  patient_name: string;
  patient_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    code: string;
    bezeichnung: string;
    quantity: number;
    amount: number;
  }>;
  created_at: string;
  updated_at: string | null;
};

const toInvoiceAppModel = (db: InvoiceDbRecord): Invoice => ({
  id: db.id,
  patientName: db.patient_name,
  patientNumber: db.patient_number,
  invoiceDate: db.invoice_date,
  dueDate: db.due_date,
  totalAmount: db.total_amount,
  paidAmount: db.paid_amount,
  status: db.status as "Entwurf" | "Versendet" | "Bezahlt" | "Überfällig" | "Storniert",
  paymentMethod: db.payment_method || undefined,
  notes: db.notes || undefined,
  items: (db.items || []).map(item => ({
    id: item.id,
    code: item.code,
    bezeichnung: item.bezeichnung,
    quantity: item.quantity,
    amount: item.amount,
  })),
  createdAt: db.created_at,
  updatedAt: db.updated_at || undefined,
});

const toInvoiceDbRecord = (invoice: Partial<Invoice>): Partial<InvoiceDbRecord> => ({
  id: invoice.id,
  patient_name: invoice.patientName,
  patient_number: invoice.patientNumber,
  invoice_date: invoice.invoiceDate,
  due_date: invoice.dueDate,
  total_amount: invoice.totalAmount,
  paid_amount: invoice.paidAmount,
  status: invoice.status,
  payment_method: invoice.paymentMethod || null,
  notes: invoice.notes || null,
  items: invoice.items?.map(item => ({
    id: item.id,
    code: item.code,
    bezeichnung: item.bezeichnung,
    quantity: item.quantity,
    amount: item.amount,
  })),
  created_at: invoice.createdAt,
  updated_at: invoice.updatedAt || null,
});

export async function fetchInvoicesFromSupabase(): Promise<Invoice[]> {
  console.log("[Billing API] Fetching invoices...");
  if (!isSupabaseConfigured) {
    console.log("[Billing API] Supabase not configured, returning empty array");
    return [];
  }
  
  try {
    const records = await supabaseRequest<InvoiceDbRecord[]>(
      `${BILLING_INVOICES_ENDPOINT}?select=*&order=invoice_date.desc`
    );
    console.log("[Billing API] Fetched invoices:", records.length);
    return records.map(toInvoiceAppModel);
  } catch (error) {
    console.error("[Billing API] Error fetching invoices:", error);
    throw error;
  }
}

export async function createInvoiceInSupabase(invoice: Invoice): Promise<Invoice> {
  console.log("[Billing API] Creating invoice:", invoice);
  if (!isSupabaseConfigured) {
    return invoice;
  }
  
  try {
    const payload = toInvoiceDbRecord(invoice);
    const [created] = await supabaseRequest<InvoiceDbRecord[]>(BILLING_INVOICES_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Billing API] Invoice created:", created.id);
    return toInvoiceAppModel(created);
  } catch (error) {
    console.error("[Billing API] Error creating invoice:", error);
    throw error;
  }
}

export async function updateInvoiceInSupabase(id: string, invoice: Partial<Invoice>): Promise<void> {
  console.log("[Billing API] Updating invoice:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    const payload = toInvoiceDbRecord(invoice);
    await supabaseRequest(`${BILLING_INVOICES_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("[Billing API] Invoice updated successfully");
  } catch (error) {
    console.error("[Billing API] Error updating invoice:", error);
    throw error;
  }
}

export async function deleteInvoiceFromSupabase(id: string): Promise<void> {
  console.log("[Billing API] Deleting invoice:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${BILLING_INVOICES_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[Billing API] Invoice deleted successfully");
  } catch (error) {
    console.error("[Billing API] Error deleting invoice:", error);
    throw error;
  }
}
