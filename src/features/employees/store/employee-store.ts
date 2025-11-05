import { create } from "zustand";
import { nanoid } from "nanoid";

import type { Employee } from "@/data/employees";
import { employees as seedEmployees } from "@/data/employees";
import type { EmployeePayload, EmployeeProfile } from "@/features/employees/types";
import {
  createEmployeeInSupabase,
  deleteEmployeeInSupabase,
  fetchEmployeesFromSupabase,
  updateEmployeeInSupabase,
} from "@/features/employees/api/employee-api";
import { isSupabaseConfigured } from "@/services/supabase-client";

interface EmployeeStoreState {
  employees: EmployeeProfile[];
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  fetchEmployees: () => Promise<void>;
  addEmployee: (payload: EmployeePayload) => EmployeeProfile;
  updateEmployee: (id: string, changes: Partial<EmployeePayload>) => void;
  removeEmployee: (id: string) => void;
  toggleEmployeeActive: (id: string, active?: boolean) => void;
}

const palette = [
  "#6366F1",
  "#F59E0B",
  "#10B981",
  "#F97316",
  "#EC4899",
  "#3B82F6",
  "#A855F7",
  "#14B8A6",
  "#0EA5E9",
  "#D946EF",
];

function enhanceEmployee(employee: Employee, index: number): EmployeeProfile {
  return {
    ...employee,
    email: undefined,
    phone: undefined,
    color: palette[index % palette.length],
    active: true,
    createdAt: new Date().toISOString(),
  };
}

const initialProfiles = seedEmployees.map(enhanceEmployee);

export const useEmployeeDirectory = create<EmployeeStoreState>((set, get) => {
  const persistCreate = async (profile: EmployeeProfile) => {
    try {
      console.log("[Employee Store] Persisting new employee:", profile.name);
      const saved = await createEmployeeInSupabase(profile);
      if (saved) {
        console.log("[Employee Store] Employee persisted, updating local state");
        set((state) => ({
          employees: state.employees.map((employee) => (employee.id === profile.id ? saved : employee)),
        }));
      }
    } catch (error) {
      console.error("[Employee Store] Failed to persist employee in Supabase", error);
    }
  };

  const persistUpdate = async (id: string, changes: Partial<EmployeeProfile>) => {
    if (!Object.keys(changes).length) {
      return;
    }
    try {
      const saved = await updateEmployeeInSupabase(id, changes);
      if (saved) {
        set((state) => ({
          employees: state.employees.map((employee) => (employee.id === id ? saved : employee)),
        }));
      }
    } catch (error) {
      console.error("Failed to update employee in Supabase", error);
    }
  };

  const persistDelete = async (id: string) => {
    try {
      await deleteEmployeeInSupabase(id);
    } catch (error) {
      console.error("Failed to remove employee in Supabase", error);
    }
  };

  return {
    employees: initialProfiles,
    isLoading: false,
    error: null,
    initialized: false,
    fetchEmployees: async () => {
      console.log("[Employee Store] fetchEmployees called, configured:", isSupabaseConfigured);
      if (!isSupabaseConfigured) {
        console.log("[Employee Store] Supabase not configured, using mock data");
        set({ initialized: true });
        return;
      }
      set({ isLoading: true, error: null });
      try {
        const remoteEmployees = await fetchEmployeesFromSupabase();
        console.log("[Employee Store] Loaded", remoteEmployees.length, "employees from Supabase");
        set({
          employees: remoteEmployees,
          isLoading: false,
          initialized: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unbekannter Fehler";
        console.error("[Employee Store] Failed to load employees from Supabase", error);
        set({ isLoading: false, initialized: true, error: message });
      }
    },
    addEmployee: (payload) => {
      const profile = buildProfile(payload);
      set((state) => ({ employees: [profile, ...state.employees] }));
      void persistCreate(profile);
      return profile;
    },
    updateEmployee: (id, changes) => {
      const sanitized = sanitizeEmployeeChanges(changes);
      if (!Object.keys(sanitized).length) {
        return;
      }
      set((state) => ({
        employees: state.employees.map((employee) =>
          employee.id === id
            ? {
                ...employee,
                name: sanitized.name ?? employee.name,
                role: sanitized.role ?? employee.role,
                department: sanitized.department ?? employee.department,
                email: sanitized.email !== undefined ? sanitized.email : employee.email,
                phone: sanitized.phone !== undefined ? sanitized.phone : employee.phone,
                color: sanitized.color ?? employee.color,
                active: sanitized.active ?? employee.active,
              }
            : employee,
        ),
      }));
      void persistUpdate(id, sanitized);
    },
    removeEmployee: (id) => {
      set((state) => ({ employees: state.employees.filter((employee) => employee.id !== id) }));
      void persistDelete(id);
    },
    toggleEmployeeActive: (id, active) => {
      const current = get().employees.find((employee) => employee.id === id);
      if (!current) {
        return;
      }
      const nextActive = typeof active === "boolean" ? active : !current.active;
      set((state) => ({
        employees: state.employees.map((employee) =>
          employee.id === id ? { ...employee, active: nextActive } : employee,
        ),
      }));
      void persistUpdate(id, { active: nextActive });
    },
  };
});

export function getEmployeeName(employees: EmployeeProfile[], id: string) {
  return employees.find((employee) => employee.id === id)?.name ?? "Teammitglied";
}

export function getEmployeeById(employees: EmployeeProfile[], id: string) {
  return employees.find((employee) => employee.id === id) ?? null;
}

export type { EmployeeProfile, EmployeePayload } from "@/features/employees/types";

function buildProfile({ id, color, active = true, ...rest }: EmployeePayload): EmployeeProfile {
  return {
    id: id?.trim() || nanoid(),
    name: rest.name.trim(),
    role: rest.role.trim(),
    department: rest.department.trim(),
    email: rest.email?.trim() || undefined,
    phone: rest.phone?.trim() || undefined,
    color: color ?? palette[Math.floor(Math.random() * palette.length)],
    active,
    createdAt: new Date().toISOString(),
  };
}

function sanitizeEmployeeChanges(changes: Partial<EmployeePayload>): Partial<EmployeeProfile> {
  const sanitized: Partial<EmployeeProfile> = {};
  if (changes.name !== undefined) {
    sanitized.name = changes.name.trim();
  }
  if (changes.role !== undefined) {
    sanitized.role = changes.role.trim();
  }
  if (changes.department !== undefined) {
    sanitized.department = changes.department.trim();
  }
  if (changes.email !== undefined) {
    sanitized.email = changes.email.trim() || undefined;
  }
  if (changes.phone !== undefined) {
    sanitized.phone = changes.phone.trim() || undefined;
  }
  if (changes.color !== undefined) {
    sanitized.color = changes.color;
  }
  if (typeof changes.active === "boolean") {
    sanitized.active = changes.active;
  }
  return sanitized;
}


