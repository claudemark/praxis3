import { isSupabaseConfigured, supabaseRequest } from "@/services/supabase-client";
import type { EmployeeProfile } from "@/features/employees/types";

type EmployeeRecord = {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

const EMPLOYEE_ENDPOINT = "/employees";

const toProfile = (record: EmployeeRecord): EmployeeProfile => ({
  id: record.id,
  name: record.name,
  role: record.role,
  department: record.department,
  email: record.email ?? undefined,
  phone: record.phone ?? undefined,
  color: record.color ?? "#6366F1",
  active: record.active ?? true,
  createdAt: record.created_at ?? new Date().toISOString(),
});

const toRecord = (profile: Partial<EmployeeProfile>): Partial<EmployeeRecord> => ({
  id: profile.id,
  name: profile.name,
  role: profile.role,
  department: profile.department,
  email: profile.email ?? null,
  phone: profile.phone ?? null,
  color: profile.color ?? null,
  active: typeof profile.active === "boolean" ? profile.active : null,
  created_at: profile.createdAt,
});

export async function fetchEmployeesFromSupabase(): Promise<EmployeeProfile[]> {
  console.log("[Employee API] Fetching employees, Supabase configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    return [];
  }
  const records = await supabaseRequest<EmployeeRecord[]>(`${EMPLOYEE_ENDPOINT}?select=*`);
  console.log("[Employee API] Fetched", records.length, "employees from Supabase");
  return records.map(toProfile);
}

export async function createEmployeeInSupabase(profile: EmployeeProfile): Promise<EmployeeProfile> {
  console.log("[Employee API] Creating employee:", profile.name, "Configured:", isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    console.log("[Employee API] Supabase not configured, returning profile as-is");
    return profile;
  }
  try {
    const payload = toRecord(profile);
    console.log("[Employee API] Sending payload to Supabase:", payload);
    const [record] = await supabaseRequest<EmployeeRecord[]>(EMPLOYEE_ENDPOINT, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    console.log("[Employee API] Employee created successfully:", record);
    return toProfile(record);
  } catch (error) {
    console.error("[Employee API] Error creating employee:", error);
    throw error;
  }
}

export async function updateEmployeeInSupabase(
  id: string,
  changes: Partial<EmployeeProfile>,
): Promise<EmployeeProfile | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const payload = toRecord({ ...changes, id });
  delete payload.id;
  if (Object.keys(payload).length === 0) {
    return null;
  }
  const [record] = await supabaseRequest<EmployeeRecord[]>(`${EMPLOYEE_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return record ? toProfile(record) : null;
}

export async function deleteEmployeeInSupabase(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabaseRequest(`${EMPLOYEE_ENDPOINT}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
    skipJsonParse: true,
  });
}
