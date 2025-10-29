import type { Employee } from "@/data/employees";

export interface EmployeeProfile extends Employee {
  email?: string;
  phone?: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export type EmployeePayload = Omit<EmployeeProfile, "id" | "createdAt" | "color" | "active"> & {
  id?: string;
  color?: string;
  active?: boolean;
};
