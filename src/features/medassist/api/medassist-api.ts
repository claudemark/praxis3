import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { MedAssistSession } from "@/data/medassist";

const SESSIONS_ENDPOINT = "/medassist_sessions";

type MedAssistSessionDbRecord = {
  id: string;
  patient_info: {
    name: string;
    geburtsdatum: string;
    versicherung: string;
    vorgang: string;
  };
  doctor: string;
  status: string;
  created_at: string;
  last_edited: string;
  duration_seconds: number;
  transcript: string;
  segments: Array<{
    id: string;
    label: string;
    content: string;
    risk?: "unsicher" | "hinweis";
    suggestions?: string[];
  }>;
  suggestions: Array<{
    id: string;
    type: "icd" | "goa" | "hinweis";
    code?: string;
    title: string;
    confidence: number;
    description: string;
  }>;
};

const toAppModel = (db: MedAssistSessionDbRecord): MedAssistSession => ({
  id: db.id,
  patient: {
    name: db.patient_info.name,
    geburtsdatum: db.patient_info.geburtsdatum,
    versicherung: db.patient_info.versicherung,
    vorgang: db.patient_info.vorgang,
  },
  arzt: db.doctor,
  status: db.status as "entwurf" | "freigabe" | "abgeschlossen",
  createdAt: db.created_at,
  lastEdited: db.last_edited,
  durationSeconds: db.duration_seconds,
  transcript: db.transcript,
  segments: db.segments || [],
  suggestions: db.suggestions || [],
});

const toDbRecord = (session: Partial<MedAssistSession>): Partial<MedAssistSessionDbRecord> => ({
  id: session.id,
  patient_info: session.patient ? {
    name: session.patient.name,
    geburtsdatum: session.patient.geburtsdatum,
    versicherung: session.patient.versicherung,
    vorgang: session.patient.vorgang,
  } : undefined,
  doctor: session.arzt,
  status: session.status,
  created_at: session.createdAt,
  last_edited: new Date().toISOString(),
  duration_seconds: session.durationSeconds,
  transcript: session.transcript,
  segments: session.segments,
  suggestions: session.suggestions,
});

export async function fetchMedAssistSessionsFromSupabase(): Promise<MedAssistSession[]> {
  console.log("[MedAssist API] Fetching sessions, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  
  try {
    const records = await supabaseRequest<MedAssistSessionDbRecord[]>(`${SESSIONS_ENDPOINT}?select=*&order=created_at.desc`);
    console.log("[MedAssist API] Fetched", records.length, "sessions from Supabase");
    return records.map(toAppModel);
  } catch (error) {
    console.error("[MedAssist API] Error fetching sessions:", error);
    throw error;
  }
}

export async function createMedAssistSessionInSupabase(session: MedAssistSession): Promise<MedAssistSession> {
  console.log("[MedAssist API] Creating session:", session.id);
  if (!isSupabaseConfigured) {
    return session;
  }
  
  try {
    const [record] = await supabaseRequest<MedAssistSessionDbRecord[]>(SESSIONS_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...toDbRecord(session), created_at: new Date().toISOString() }),
    });
    console.log("[MedAssist API] Session created successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[MedAssist API] Error creating session:", error);
    throw error;
  }
}

export async function updateMedAssistSessionInSupabase(id: string, changes: Partial<MedAssistSession>): Promise<MedAssistSession | null> {
  console.log("[MedAssist API] Updating session:", id);
  if (!isSupabaseConfigured) {
    return null;
  }
  
  try {
    const [record] = await supabaseRequest<MedAssistSessionDbRecord[]>(`${SESSIONS_ENDPOINT}?id=eq.${id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(toDbRecord(changes)),
    });
    console.log("[MedAssist API] Session updated successfully");
    return toAppModel(record);
  } catch (error) {
    console.error("[MedAssist API] Error updating session:", error);
    return null;
  }
}

export async function deleteMedAssistSessionFromSupabase(id: string): Promise<void> {
  console.log("[MedAssist API] Deleting session:", id);
  if (!isSupabaseConfigured) {
    return;
  }
  
  try {
    await supabaseRequest(`${SESSIONS_ENDPOINT}?id=eq.${id}`, {
      method: "DELETE",
    });
    console.log("[MedAssist API] Session deleted successfully");
  } catch (error) {
    console.error("[MedAssist API] Error deleting session:", error);
    throw error;
  }
}
