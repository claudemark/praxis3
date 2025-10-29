export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarSeed?: string;
}

export const employees: Employee[] = [
  { id: "emp-krause", name: "Dr. Amelie Krause", role: "Orthopädin", department: "Medizin" },
  { id: "emp-vogt", name: "Dr. Marten Vogt", role: "Unfallchirurg", department: "Medizin" },
  { id: "emp-nguyen", name: "Dr. Sofie Nguyen", role: "Qualitätssicherung", department: "QS" },
  { id: "emp-feld", name: "Nora Feld", role: "OP-Koordination", department: "OP" },
  { id: "emp-boettcher", name: "Lena Böttcher", role: "Physiotherapie", department: "Reha" },
  { id: "emp-linde", name: "Marcus Linde", role: "Praxismanager", department: "Verwaltung" },
  { id: "emp-werner", name: "Franziska Werner", role: "Finanzcontrolling", department: "Verwaltung" },
  { id: "emp-rehm", name: "Jonas Rehm", role: "OP Pflege", department: "OP" },
  { id: "emp-kranz", name: "Julia Kranz", role: "Radiologie", department: "Diagnostik" },
  { id: "emp-mailer", name: "Simon Mailer", role: "MFA", department: "Praxis" },
];

export function getEmployeeById(id: string) {
  return employees.find((employee) => employee.id === id);
}
