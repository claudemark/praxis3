import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { ConsultationRecord } from "@/data/consultations";

type ConsultationDbRecord = {
  id: string;
  patient_name: string;
  patient_number: string;
  consultation_date: string;
  doctor_id: string;
  type: string;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const CONSULTATION_ENDPOINT = "/consultations";

const toAppModel = (record: ConsultationDbRecord): ConsultationRecord => {
  // Map database fields to app model
  // Note: Some fields might not exist in DB, using defaults
  return {
    id: record.id,
    date: new Date(record.consultation_date).toISOString().split('T')[0],
    patient: record.patient_name,
    patientId: record.patient_number,
    insurance: "privat" as const, // Default, can be enhanced later
    consultationType: record.type,
    source: "Telefon" as const, // Default, can be enhanced later
    status: mapDbStatusToApp(record.status),
    revenue: 0, // Not in current DB schema
    followUpNeeded: !!record.follow_up_date,
    notes: record.notes || undefined,
  };
};

const toDbRecord = (consultation: Partial<ConsultationRecord>): Partial<ConsultationDbRecord> => ({
  id: consultation.id,
  patient_name: consultation.patient,
  patient_number: consultation.patientId,
  consultation_date: consultation.date ? new Date(consultation.date).toISOString() : undefined,
  doctor_id: "default-doctor", // Can be enhanced later
  type: consultation.consultationType,
  notes: consultation.notes || null,
  follow_up_date: consultation.followUpNeeded ? new Date().toISOString() : null,
  status: mapAppStatusToDb(consultation.status),
});

function mapDbStatusToApp(status: string): ConsultationRecord["status"] {
  switch (status) {
    case "completed":
      return "Abgeschlossen";
    case "scheduled":
      return "Offen";
    case "cancelled":
      return "Follow-up";
    default:
      return "Offen";
  }
}

function mapAppStatusToDb(status?: ConsultationRecord["status"]): string {
  switch (status) {
    case "Abgeschlossen":
      return "completed";
    case "Follow-up":
      return "scheduled";
    case "Offen":
    default:
      return "scheduled";
  }
}

export async function fetchConsultationsFromSupabase(): Promise<ConsultationRecord[]> {
  console.log("[Consultation API] Fetching consultations, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<ConsultationDbRecord[]>(`${CONSULTATION_ENDPOINT}?select=*&order=consultation_date.desc`);
  console.log("[Consultation API] Fetched", records.length, "consultations from Supabase");
  return records.map(toAppModel);
}

export async function createConsultationInSupabase(consultation: ConsultationRecord): Promise<ConsultationRecord> {
  console.log("[Consultation API] Creating consultation:", consultation.patient, "Configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return consultation;
  }
  try {
    const payload = toDbRecord(consultation);
    console.log("[Consultation API] Sending payload:", payload);
    const [record] = await supabaseRequest<ConsultationDbRecord[]>(CONSULTATION_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Consultation API] Created successfully:", record);
    return toAppModel(record);
  } catch (error) {
    console.error("[Consultation API] Error creating:", error);
    throw error;
  }
}

export async function updateConsultationInSupabase(
  id: string,
  changes: Partial<ConsultationRecord>,
): Promise<ConsultationRecord | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const payload = toDbRecord({ ...changes, id });
  delete payload.id;
  if (Object.keys(payload).length === 0) {
    return null;
  }
  const [record] = await supabaseRequest<ConsultationDbRecord[]>(
    `${CONSULTATION_ENDPOINT}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );
  return record ? toAppModel(record) : null;
}

export async function deleteConsultationInSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabaseRequest(`${CONSULTATION_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    skipJsonParse: true,
  });
}
